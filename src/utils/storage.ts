import { Project } from '../types';
import { SAMPLE_PROJECT } from './sampleData';
import { isValidCharacterName, pruneIncompleteCharacterNames, pruneIncompleteLocationNames } from './fountain';

const PROJECTS_STORAGE_KEY = 'guionstudio_projects_v1';
const ACTIVE_PROJECT_ID_KEY = 'guionstudio_active_project_id_v1';
const OPEN_TABS_STORAGE_KEY = 'guionstudio_open_doc_tabs_v1';

export function loadAllProjects(): Project[] {
  try {
    const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (!raw) {
      // First time initialization with rich sample project
      saveAllProjects([SAMPLE_PROJECT]);
      localStorage.setItem(ACTIVE_PROJECT_ID_KEY, SAMPLE_PROJECT.id);
      saveOpenDocTabIds([SAMPLE_PROJECT.id]);
      return [SAMPLE_PROJECT];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Clean and sanitize loaded projects (remove corrupted character profiles and partial typing prefixes in locations)
      const sanitized = parsed.map((proj: Project) => {
        if (!proj || !proj.id) return proj;
        const referencedCharNames = new Set(
          (proj.blocks || [])
            .filter((b) => b.type === 'character')
            .map((b) => b.content.replace(/\s*\(.*?\)\s*/g, '').trim().toUpperCase())
        );
        const validChars = pruneIncompleteCharacterNames(proj.characters || []).filter((c) => {
          const upper = c.name.trim().toUpperCase();
          const hasCustomDetails = Boolean(
            (c.description && c.description.trim().length > 0) ||
            (c.actorName && c.actorName.trim().length > 0) ||
            (c.notes && c.notes.trim().length > 0)
          );
          return referencedCharNames.has(upper) || hasCustomDetails;
        });
        // Also prune and sanitize locations (removes 'LUG', 'LUGA', 'LUGAR DÍA', ghost typing artifacts, duplicates, etc.)
        const validLocs = pruneIncompleteLocationNames(proj.locations || [], proj.blocks || []);

        return {
          ...proj,
          characters: validChars,
          locations: validLocs,
        };
      });
      // Save sanitized copy to keep localStorage clean
      saveAllProjects(sanitized);
      return sanitized;
    }
    return [SAMPLE_PROJECT];
  } catch (err) {
    console.error('Error loading projects from localStorage:', err);
    return [SAMPLE_PROJECT];
  }
}

export function getOpenDocTabIds(availableProjects: Project[]): string[] {
  try {
    const raw = localStorage.getItem(OPEN_TABS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Filter only existing projects
        const validIds = parsed.filter(id => availableProjects.some(p => p.id === id));
        if (validIds.length > 0) return validIds;
      }
    }
  } catch (e) {
    console.error('Error reading open tabs:', e);
  }
  return availableProjects.map(p => p.id).slice(0, 4);
}

export function saveOpenDocTabIds(tabIds: string[]): void {
  try {
    localStorage.setItem(OPEN_TABS_STORAGE_KEY, JSON.stringify(tabIds));
  } catch (e) {
    console.error('Error saving open tabs:', e);
  }
}

export function saveAllProjects(projects: Project[]): void {
  try {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
  } catch (err) {
    console.error('Error saving projects to localStorage:', err);
  }
}

export function getActiveProjectId(): string {
  const storedId = localStorage.getItem(ACTIVE_PROJECT_ID_KEY);
  if (storedId) return storedId;
  return SAMPLE_PROJECT.id;
}

export function setActiveProjectId(id: string): void {
  localStorage.setItem(ACTIVE_PROJECT_ID_KEY, id);
}

export function saveProject(project: Project): Project[] {
  const all = loadAllProjects();
  const updatedProject = {
    ...project,
    updatedAt: Date.now(),
  };
  const index = all.findIndex((p) => p.id === project.id);
  if (index >= 0) {
    all[index] = updatedProject;
  } else {
    all.push(updatedProject);
  }
  saveAllProjects(all);
  return all;
}

export function deleteProject(id: string): { updatedProjects: Project[]; nextActiveId: string } {
  let all = loadAllProjects();
  all = all.filter((p) => p.id !== id);
  if (all.length === 0) {
    all = [SAMPLE_PROJECT];
  }
  saveAllProjects(all);
  const nextActiveId = all[0].id;
  setActiveProjectId(nextActiveId);
  return { updatedProjects: all, nextActiveId };
}

export function duplicateProject(project: Project): Project {
  const newProj: Project = {
    ...JSON.parse(JSON.stringify(project)),
    id: 'proj_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
    title: `${project.title} (COPIA)`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    titlePage: {
      ...project.titlePage,
      title: `${project.titlePage?.title || project.title} (COPIA)`,
    },
  };
  saveProject(newProj);
  return newProj;
}

export function exportProjectAsJson(project: Project) {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(project, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `${(project.title || 'guion').toLowerCase().replace(/\s+/g, '_')}_proyecto.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function importProjectFromJson(jsonString: string): Project | null {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed.title || !Array.isArray(parsed.blocks)) {
      throw new Error('Formato de proyecto inválido');
    }
    const newId = 'proj_imp_' + Date.now().toString(36);
    const imported: Project = {
      ...parsed,
      id: newId,
      updatedAt: Date.now(),
    };
    saveProject(imported);
    return imported;
  } catch (err) {
    console.error('Error importing project:', err);
    return null;
  }
}
