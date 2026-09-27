import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Project, ScriptBlock, ViewTab, TitlePageData, CharacterProfile, LocationItem } from './types';
import { 
  loadAllProjects, 
  saveProject, 
  deleteProject as deleteProjectStorage, 
  duplicateProject as duplicateProjectStorage, 
  getActiveProjectId, 
  setActiveProjectId, 
  importProjectFromJson, 
  exportProjectAsJson,
  getOpenDocTabIds,
  saveOpenDocTabIds
} from './utils/storage';
import { createNewProject, SAMPLE_PROJECT } from './utils/sampleData';
import { extractMetadataFromBlocks, generateId } from './utils/fountain';
import { exportProjectToPdf } from './utils/pdfExport';

import { UnifiedHeader } from './components/UnifiedHeader';
import { ScreenplayEditor } from './components/ScreenplayEditor';
import { ScreenplayPagePreview } from './components/ScreenplayPagePreview';
import { ProductionView } from './components/ProductionView';
import { LocationsBreakdown } from './components/LocationsBreakdown';
import { CharactersDirectory } from './components/CharactersDirectory';
import { BeatSheetCards } from './components/BeatSheetCards';
import { TitlePageEditor } from './components/TitlePageEditor';
import { ProjectManagerModal } from './components/ProjectManagerModal';
import { ExportModal } from './components/ExportModal';

export default function App() {
  const [projects, setProjects] = useState<Project[]>(() => loadAllProjects());
  const [activeProjectId, setActiveId] = useState<string>(() => getActiveProjectId());
  const [openTabIds, setOpenTabIds] = useState<string[]>(() => getOpenDocTabIds(loadAllProjects()));
  const [currentTab, setCurrentTab] = useState<ViewTab>('editor');
  const [isSaved, setIsSaved] = useState<boolean>(true);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('guionstudio_dark_mode');
    return saved !== null ? saved === 'true' : true;
  });

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem('guionstudio_dark_mode', String(next));
      return next;
    });
  };

  // Modals & Panels
  const [isProjectModalOpen, setIsProjectModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState<boolean>(false);

  const toggleSidePanel = () => setIsSidePanelOpen((prev) => !prev);

  // Keep openTabIds in sync with localStorage and ensure active project is in open tabs
  useEffect(() => {
    saveOpenDocTabIds(openTabIds);
  }, [openTabIds]);

  // Ensure activeProjectId is valid and in openTabIds
  useEffect(() => {
    if (!openTabIds.includes(activeProjectId)) {
      setOpenTabIds((prev) => [activeProjectId, ...prev]);
    }
  }, [activeProjectId, openTabIds]);

  // Active Project Reference
  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0] || SAMPLE_PROJECT;

  // Auto-sync project updates to state and storage
  const handleUpdateActiveProject = useCallback((updatedProject: Project) => {
    setIsSaved(false);
    
    // Auto extract new characters and locations from blocks to keep them updated
    const { characters: extractedChars, locations: extractedLocs } = extractMetadataFromBlocks(
      updatedProject.blocks,
      updatedProject.characters,
      updatedProject.locations
    );

    const fullProject: Project = {
      ...updatedProject,
      characters: extractedChars,
      locations: extractedLocs,
      updatedAt: Date.now(),
    };

    setProjects((prev) => {
      const idx = prev.findIndex((p) => p.id === fullProject.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = fullProject;
        saveProject(fullProject);
        return next;
      }
      const next = [...prev, fullProject];
      saveProject(fullProject);
      return next;
    });

    setTimeout(() => setIsSaved(true), 600);
  }, []);

  const handleUpdateBlocks = (blocks: ScriptBlock[]) => {
    handleUpdateActiveProject({
      ...activeProject,
      blocks,
    });
  };

  const handleUpdateTitlePage = (titlePage: TitlePageData) => {
    handleUpdateActiveProject({
      ...activeProject,
      titlePage,
      title: titlePage.title !== undefined ? titlePage.title : activeProject.title,
    });
  };

  const handleUpdateSettings = (settings: Project['settings']) => {
    handleUpdateActiveProject({
      ...activeProject,
      settings,
    });
  };

  const handleUpdateCharacters = (characters: CharacterProfile[]) => {
    handleUpdateActiveProject({
      ...activeProject,
      characters,
    });
  };

  const handleUpdateLocations = (locations: LocationItem[]) => {
    handleUpdateActiveProject({
      ...activeProject,
      locations,
    });
  };

  const handleUpdateProjectTitle = (title: string) => {
    handleUpdateActiveProject({
      ...activeProject,
      title,
      titlePage: {
        ...activeProject.titlePage,
        title,
      },
    });
  };

  const handleUpdateSpecificProjectTitle = (id: string, newTitle: string) => {
    const target = projects.find(p => p.id === id);
    if (!target) return;
    const updated = {
      ...target,
      title: newTitle,
      titlePage: {
        ...target.titlePage,
        title: newTitle,
      },
    };
    saveProject(updated);
    setProjects(prev => prev.map(p => p.id === id ? updated : p));
  };

  // Switch Active Tab / Document
  const handleSelectTab = (id: string) => {
    setActiveId(id);
    setActiveProjectId(id);
    if (!openTabIds.includes(id)) {
      setOpenTabIds((prev) => [...prev, id]);
    }
  };

  // Close Tab
  const handleCloseTab = (id: string) => {
    if (openTabIds.length <= 1) return; // Keep at least one tab
    const nextTabs = openTabIds.filter((tabId) => tabId !== id);
    setOpenTabIds(nextTabs);

    if (activeProjectId === id) {
      const nextActiveId = nextTabs[0];
      setActiveId(nextActiveId);
      setActiveProjectId(nextActiveId);
    }
  };

  // Open existing project in new tab
  const handleOpenExistingInNewTab = (id: string) => {
    if (!openTabIds.includes(id)) {
      setOpenTabIds((prev) => [...prev, id]);
    }
    setActiveId(id);
    setActiveProjectId(id);
  };

  // Create New Tab (New Document / Project)
  const handleNewTab = (type: Project['type'] = 'short', template = 'blank') => {
    const count = projects.length + 1;
    const defaultTitle = template === 'short_drama' 
      ? `CORTOMETRAJE ${count}` 
      : template === 'feature_action' 
        ? `LARGOMETRAJE ${count}` 
        : `TÍTULO DEL GUIÓN ${count}`;

    const newProj = createNewProject(defaultTitle, type, template);
    const updated = saveProject(newProj);
    setProjects(updated);
    setOpenTabIds((prev) => [...prev, newProj.id]);
    setActiveId(newProj.id);
    setActiveProjectId(newProj.id);
    setCurrentTab('editor');

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#f59e0b', '#10b981', '#6366f1'],
    });
  };

  // Switch Active Project from Modal
  const handleSelectProject = (id: string) => {
    handleOpenExistingInNewTab(id);
  };

  // Create New Project from Modal
  const handleCreateNewProject = (title: string, type: Project['type'], template?: string) => {
    const newProj = createNewProject(title, type, template);
    const updated = saveProject(newProj);
    setProjects(updated);
    setOpenTabIds((prev) => [...prev, newProj.id]);
    setActiveId(newProj.id);
    setActiveProjectId(newProj.id);
    setCurrentTab('editor');

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#f59e0b', '#10b981', '#6366f1'],
    });
  };

  // Duplicate Project
  const handleDuplicateProject = (proj: Project) => {
    const cloned = duplicateProjectStorage(proj);
    const updatedAll = loadAllProjects();
    setProjects(updatedAll);
    setOpenTabIds((prev) => [...prev, cloned.id]);
    setActiveId(cloned.id);
    setActiveProjectId(cloned.id);
  };

  // Delete Project
  const handleDeleteProject = (id: string) => {
    const { updatedProjects, nextActiveId } = deleteProjectStorage(id);
    setProjects(updatedProjects);
    const nextTabs = openTabIds.filter(tId => tId !== id);
    setOpenTabIds(nextTabs.length > 0 ? nextTabs : [nextActiveId]);
    setActiveId(nextActiveId);
  };

  // Import Project
  const handleImportJson = (jsonStr: string) => {
    const imported = importProjectFromJson(jsonStr);
    if (imported) {
      setProjects(loadAllProjects());
      setOpenTabIds((prev) => [...prev, imported.id]);
      setActiveId(imported.id);
      setActiveProjectId(imported.id);
      setIsProjectModalOpen(false);
      confetti({ particleCount: 40, spread: 50 });
    } else {
      alert('Error al importar el archivo. Verifica que sea un formato JSON válido.');
    }
  };

  // Quick Action handlers
  const handleQuickDownloadPdf = () => {
    exportProjectToPdf(activeProject);
  };

  const handleQuickPrint = () => {
    window.print();
  };

  // Add scene from Location view
  const handleAddSceneForLocation = (location: LocationItem) => {
    const newHeading: ScriptBlock = {
      id: generateId(),
      type: 'scene_heading',
      content: `${location.type}. ${location.name} - ${location.timeOfDay}`,
      sceneNumber: activeProject.blocks.filter((b) => b.type === 'scene_heading').length + 1,
    };
    const newAction: ScriptBlock = {
      id: generateId(),
      type: 'action',
      content: location.description || 'Descripción del entorno visual...',
    };

    handleUpdateBlocks([...activeProject.blocks, newHeading, newAction]);
    setCurrentTab('editor');
  };

  // Insert Character dialogue from Character view
  const handleInsertCharacterDialogue = (char: CharacterProfile) => {
    const charBlock: ScriptBlock = {
      id: generateId(),
      type: 'character',
      content: char.name.toUpperCase(),
    };
    const dialBlock: ScriptBlock = {
      id: generateId(),
      type: 'dialogue',
      content: '',
    };

    handleUpdateBlocks([...activeProject.blocks, charBlock, dialBlock]);
    setCurrentTab('editor');
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans selection:bg-amber-400 selection:text-black transition-colors duration-200 ${
      isDarkMode ? 'bg-[#121214] text-[#E0E0E0]' : 'bg-[#F4F4F1] text-[#1A1A1A]'
    }`}>
      {/* Ultra-Thin Consolidated Header with Integrated Tabs and Square Hover-Reveal Buttons */}
      <UnifiedHeader
        project={activeProject}
        allProjects={projects}
        openTabIds={openTabIds}
        activeProjectId={activeProjectId}
        onSelectTab={handleSelectTab}
        onCloseTab={handleCloseTab}
        onNewTab={handleNewTab}
        onOpenExistingInNewTab={handleOpenExistingInNewTab}
        onDuplicateProject={handleDuplicateProject}
        onUpdateTitle={handleUpdateSpecificProjectTitle}
        onImportJson={handleImportJson}
        onOpenProjectModal={() => setIsProjectModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onQuickDownloadPdf={handleQuickDownloadPdf}
        onQuickPrint={handleQuickPrint}
        onManualSave={() => handleUpdateActiveProject(activeProject)}
        isSaved={isSaved}
        currentTab={currentTab}
        onChangeTab={(tab) => setCurrentTab(tab)}
        isSidePanelOpen={isSidePanelOpen}
        onToggleSidePanel={toggleSidePanel}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {currentTab === 'editor' && (
          <ScreenplayEditor
            key={activeProject.id}
            project={activeProject}
            onUpdateBlocks={handleUpdateBlocks}
            onUpdateSettings={handleUpdateSettings}
            onUpdateTitlePage={handleUpdateTitlePage}
            onUpdateTitle={handleUpdateSpecificProjectTitle}
            onNavigateToPreview={() => setCurrentTab('preview')}
            onOpenExportModal={() => setIsExportModalOpen(true)}
            isDarkMode={isDarkMode}
            isSidePanelOpen={isSidePanelOpen}
            onToggleSidePanel={toggleSidePanel}
          />
        )}

        {currentTab === 'preview' && (
          <ScreenplayPagePreview
            project={activeProject}
            onPrint={handleQuickPrint}
            isDarkMode={isDarkMode}
          />
        )}

        {currentTab === 'production' && (
          <ProductionView
            project={activeProject}
            onUpdateLocations={handleUpdateLocations}
            onAddSceneForLocation={handleAddSceneForLocation}
            onUpdateCharacters={handleUpdateCharacters}
            onInsertCharacterDialogue={handleInsertCharacterDialogue}
            onUpdateBlocks={handleUpdateBlocks}
            onUpdateTitlePage={handleUpdateTitlePage}
            onSwitchToEditor={() => setCurrentTab('editor')}
            isDarkMode={isDarkMode}
          />
        )}

        {currentTab === 'locations' && (
          <ProductionView
            project={activeProject}
            onUpdateLocations={handleUpdateLocations}
            onAddSceneForLocation={handleAddSceneForLocation}
            onUpdateCharacters={handleUpdateCharacters}
            onInsertCharacterDialogue={handleInsertCharacterDialogue}
            onUpdateBlocks={handleUpdateBlocks}
            onUpdateTitlePage={handleUpdateTitlePage}
            onSwitchToEditor={() => setCurrentTab('editor')}
            isDarkMode={isDarkMode}
          />
        )}

        {currentTab === 'characters' && (
          <ProductionView
            project={activeProject}
            onUpdateLocations={handleUpdateLocations}
            onAddSceneForLocation={handleAddSceneForLocation}
            onUpdateCharacters={handleUpdateCharacters}
            onInsertCharacterDialogue={handleInsertCharacterDialogue}
            onUpdateBlocks={handleUpdateBlocks}
            onUpdateTitlePage={handleUpdateTitlePage}
            onSwitchToEditor={() => setCurrentTab('editor')}
            isDarkMode={isDarkMode}
          />
        )}

        {currentTab === 'beats' && (
          <ProductionView
            project={activeProject}
            onUpdateLocations={handleUpdateLocations}
            onAddSceneForLocation={handleAddSceneForLocation}
            onUpdateCharacters={handleUpdateCharacters}
            onInsertCharacterDialogue={handleInsertCharacterDialogue}
            onUpdateBlocks={handleUpdateBlocks}
            onUpdateTitlePage={handleUpdateTitlePage}
            onSwitchToEditor={() => setCurrentTab('editor')}
            isDarkMode={isDarkMode}
          />
        )}

        {currentTab === 'title_page' && (
          <ProductionView
            project={activeProject}
            onUpdateLocations={handleUpdateLocations}
            onAddSceneForLocation={handleAddSceneForLocation}
            onUpdateCharacters={handleUpdateCharacters}
            onInsertCharacterDialogue={handleInsertCharacterDialogue}
            onUpdateBlocks={handleUpdateBlocks}
            onUpdateTitlePage={handleUpdateTitlePage}
            onSwitchToEditor={() => setCurrentTab('editor')}
            isDarkMode={isDarkMode}
          />
        )}
      </main>

      {/* Modals */}
      <ProjectManagerModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={handleSelectProject}
        onCreateNewProject={handleCreateNewProject}
        onDuplicateProject={handleDuplicateProject}
        onDeleteProject={handleDeleteProject}
        onImportJson={handleImportJson}
        onExportJson={exportProjectAsJson}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        project={activeProject}
        onPrint={handleQuickPrint}
      />
    </div>
  );
}

