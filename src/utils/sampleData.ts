import { Project, ScriptBlock } from '../types';
import { generateId, extractMetadataFromBlocks } from './fountain';

export const SAMPLE_PROJECT: Project = {
  id: 'proj_sample_1',
  title: 'LA ÚLTIMA TOMA',
  type: 'short',
  createdAt: Date.now() - 86400000,
  updatedAt: Date.now(),
  titlePage: {
    title: 'LA ÚLTIMA TOMA',
    writtenBy: 'Mauricio Moreira',
    basedOn: 'Una idea original para cine de suspenso',
    draft: 'Segundo Borrador',
    date: 'Octubre 2026',
    contact: 'contacto@cineastastudio.com\nTel: +34 600 123 456',
    logline: 'Un director de cine obsesionado descubre que el material que grabó la noche anterior contiene un mensaje que altera el destino de su protagonista.',
    genre: 'Thriller Psicológico / Drama',
  },
  settings: {
    highlightCharacters: true,
    highlightLocations: true,
    showSceneNumbers: true,
    autoCapitalizeCharacters: true,
    paperFormat: 'US_LETTER',
    showTitlePage: true,
  },
  characters: [
    {
      id: 'char_1',
      name: 'MATEO',
      role: 'protagonist',
      age: '34 años',
      description: 'Director de fotografía meticuloso, ojeroso por las largas noches de edición.',
      colorTag: '#3b82f6',
    },
    {
      id: 'char_2',
      name: 'VALERIA',
      role: 'protagonist',
      age: '30 años',
      description: 'Actriz principal con mirada intensa y una serenidad inquietante.',
      colorTag: '#ec4899',
    },
    {
      id: 'char_3',
      name: 'ESTEBAN (V.O.)',
      role: 'supporting',
      age: '50 años',
      description: 'Productor ejecutivo impaciente que llama desde la sede central.',
      colorTag: '#f59e0b',
    },
  ],
  locations: [
    {
      id: 'loc_1',
      name: 'SALA DE EDICIÓN',
      type: 'INT',
      timeOfDay: 'NOCHE',
      description: 'Cuarto oscuro iluminado únicamente por dos monitores 4K y una lámpara de tungsteno.',
      realFilmingPlace: 'Estudio 3B, Edificio Audiovisual',
      propsNeeded: ['Consola de edición', 'Monitores de referencia', 'Taza de café fría', 'Auriculares de diadema'],
    },
    {
      id: 'loc_2',
      name: 'CALLEJÓN TRASERO DEL TEATRO',
      type: 'EXT',
      timeOfDay: 'NOCHE',
      description: 'Adoquines mojados reflejando las luces de neón del cartel del teatro.',
      realFilmingPlace: 'Calle Victoria 42, Centro Histórico',
      propsNeeded: ['Máquina de lluvia', 'Paraguas transparente', 'Gabardina mojada'],
    },
    {
      id: 'loc_3',
      name: 'CAFETERÍA EL FARO',
      type: 'INT',
      timeOfDay: 'AMANECER',
      description: 'Cafetería clásica con mesas de madera desgastada y ventanal con vista a la bahía.',
      realFilmingPlace: 'Café Marítimo, Muelle Norte',
      propsNeeded: ['Tazas de cerámica', 'Grabadora de mano', 'Libreto marcado'],
    },
  ],
  blocks: [
    {
      id: 'b_1',
      type: 'scene_heading',
      content: 'INT. SALA DE EDICIÓN - NOCHE',
      sceneNumber: 1,
    },
    {
      id: 'b_2',
      type: 'action',
      content: 'La habitación está sumida en penumbras. La única fuente de luz es el resplandor azulado de dos monitores de 32 pulgadas. Un cenicero rebosante y tres tazas de café vacías reposan sobre la mesa de mezclas.',
    },
    {
      id: 'b_3',
      type: 'action',
      content: 'MATEO (34) tiene los ojos inyectados en sangre. Sus dedos tiemblan ligeramente sobre la rueda de edición (jog-wheel). Le da PLAY al metraje.',
    },
    {
      id: 'b_4',
      type: 'character',
      content: 'MATEO',
    },
    {
      id: 'b_5',
      type: 'parenthetical',
      content: '(susurrando para sí mismo)',
    },
    {
      id: 'b_6',
      type: 'dialogue',
      content: 'No estaba ahí en el set. Te juro por mi vida que esa puerta estaba cerrada con llave.',
    },
    {
      id: 'b_7',
      type: 'action',
      content: 'En la pantalla, el vídeo muestra un plano secuencia de VALERIA caminando en reversa. De repente, la imagen parpadea. Un micro-corte revela una figura en el umbral.',
    },
    {
      id: 'b_8',
      type: 'character',
      content: 'VALERIA (V.O.)',
    },
    {
      id: 'b_9',
      type: 'dialogue',
      content: 'Si sigues buscando lo que no debes ver, Mateo, la película terminará antes de que la estrenemos.',
    },
    {
      id: 'b_10',
      type: 'action',
      content: 'Mateo se gira sobresaltado. La silla cruje. No hay nadie en la sala. El teléfono celular vibra violentamente contra el vidrio del escritorio.',
    },
    {
      id: 'b_11',
      type: 'character',
      content: 'ESTEBAN (V.O.)',
    },
    {
      id: 'b_12',
      type: 'parenthetical',
      content: '(a través del altavoz)',
    },
    {
      id: 'b_13',
      type: 'dialogue',
      content: '¿Tienes el corte final del montaje? El distribuidor aterriza en dos horas y no podemos retrasarnos un segundo más.',
    },
    {
      id: 'b_14',
      type: 'character',
      content: 'MATEO',
    },
    {
      id: 'b_15',
      type: 'dialogue',
      content: 'Esteban... la toma diecisiete. Alguien se metió en el cuadro. Pero no es nadie del equipo.',
    },
    {
      id: 'b_16',
      type: 'transition',
      content: 'CORTE A:',
    },
    {
      id: 'b_17',
      type: 'scene_heading',
      content: 'EXT. CALLEJÓN TRASERO DEL TEATRO - NOCHE (LLUVIA)',
      sceneNumber: 2,
    },
    {
      id: 'b_18',
      type: 'action',
      content: 'Lluvia torrencial golpea el pavimento adoquinado. El vapor asciende de las alcantarillas. VALERIA aguarda bajo el alero de una puerta metálica de emergencia, envuelta en una gabardina negra empapada.',
    },
    {
      id: 'b_19',
      type: 'action',
      content: 'Mateo dobla la esquina corriendo, protegiéndose con una carpeta plástica.',
    },
    {
      id: 'b_20',
      type: 'character',
      content: 'VALERIA',
    },
    {
      id: 'b_21',
      type: 'dialogue',
      content: 'Sabía que vendrías aquí. Todos los directores regresan al lugar donde perdieron el control.',
    },
    {
      id: 'b_22',
      type: 'character',
      content: 'MATEO',
    },
    {
      id: 'b_23',
      type: 'parenthetical',
      content: '(acercándose sin aliento)',
    },
    {
      id: 'b_24',
      type: 'dialogue',
      content: '¿Por qué me dijiste eso en el audio guía? Esa frase no estaba en el guion que aprobamos.',
    },
    {
      id: 'b_25',
      type: 'character',
      content: 'VALERIA',
    },
    {
      id: 'b_26',
      type: 'dialogue',
      content: 'Porque este ya no es tu guion, Mateo. Es el nuestro.',
    },
    {
      id: 'b_27',
      type: 'transition',
      content: 'FUNDIDO A NEGRO.',
    },
  ],
};

export function createNewProject(
  title: string = 'TÍTULO DEL GUIÓN',
  type: Project['type'] = 'short',
  templateType?: string
): Project {
  let initialBlocks: ScriptBlock[] = [];

  if (templateType === 'feature' || templateType === 'feature_action') {
    initialBlocks = [
      {
        id: generateId(),
        type: 'scene_heading' as const,
        content: 'EXT. CIUDAD METROPOLITANA - DÍA',
        sceneNumber: 1,
      },
      {
        id: generateId(),
        type: 'action' as const,
        content: 'El tráfico ruge bajo rascacielos de cristal. Una sirena distante corta el rumor urbano.',
      },
      {
        id: generateId(),
        type: 'scene_heading' as const,
        content: 'INT. DESPACHO DE INVESTIGACIÓN - DÍA',
        sceneNumber: 2,
      },
      {
        id: generateId(),
        type: 'action' as const,
        content: 'Expedientes abiertos sobre un escritorio de roble. SOFÍA (40) revisa una fotografía en blanco y negro.',
      },
      {
        id: generateId(),
        type: 'character' as const,
        content: 'SOFÍA',
      },
      {
        id: generateId(),
        type: 'dialogue' as const,
        content: 'Esto no fue un accidente. Alguien planeó cada segundo de esta noche.',
      },
    ];
  } else if (templateType === 'short_drama') {
    initialBlocks = [
      {
        id: generateId(),
        type: 'scene_heading' as const,
        content: 'INT. HABITACIÓN - DÍA',
        sceneNumber: 1,
      },
      {
        id: generateId(),
        type: 'action' as const,
        content: 'La luz del sol entra por la ventana entreabierta, proyectando sombras alargadas sobre el suelo de madera.',
      },
      {
        id: generateId(),
        type: 'character' as const,
        content: 'PROTAGONISTA',
      },
      {
        id: generateId(),
        type: 'parenthetical' as const,
        content: '(mirando alrededor)',
      },
      {
        id: generateId(),
        type: 'dialogue' as const,
        content: 'Es hora de comenzar.',
      },
    ];
  } else {
    // Default / 'blank' template for "Nuevo guion": Pristine, clean initialization with a single clean empty scene heading line
    initialBlocks = [
      {
        id: generateId(),
        type: 'scene_heading' as const,
        content: '',
        sceneNumber: 1,
      },
    ];
  }

  const { characters, locations } = extractMetadataFromBlocks(initialBlocks);

  return {
    id: 'proj_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
    title: title.toUpperCase(),
    type,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    titlePage: {
      title: title.toUpperCase(),
      writtenBy: 'Mauricio Moreira',
      draft: 'Primer Borrador',
      date: new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
      contact: 'contacto@guionstudio.com',
      logline: '',
      genre: 'Drama',
    },
    settings: {
      highlightCharacters: true,
      highlightLocations: true,
      showSceneNumbers: true,
      autoCapitalizeCharacters: true,
      paperFormat: 'US_LETTER',
      showTitlePage: true,
    },
    blocks: initialBlocks,
    characters,
    locations,
  };
}
