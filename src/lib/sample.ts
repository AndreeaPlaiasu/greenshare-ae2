import { DATES, type Library, type Equipment } from './domain.ts';
import type { CatalogueItem } from './data';
// Illustrative inventory only. These are not claims about real lending services.
export const sampleLibraries: Library[] = [
  { id: 'north-london', name: 'North London Library', address: 'Broomfield Park, Aldermans Hill, London N13 4HE', latitude: 51.618, longitude: -0.109, status: 'active', version: 1 },
  { id: 'riverside', name: 'Riverside Library', address: 'Queen Elizabeth Olympic Park, London E20 2ST', latitude: 51.543, longitude: -0.016, status: 'active', version: 1 },
  { id: 'southbank', name: 'Southbank Library', address: 'Belvedere Road, London SE1 8XX', latitude: 51.505, longitude: -0.116, status: 'active', version: 1 },
];
const equipment: Array<[string, string, string, Equipment['category'], string, number]> = [
  ['cordless-drill', 'north-london', 'Cordless drill kit', 'Tool', 'A versatile drill, two batteries and a complete bit set. Ready for the jobs on your list.', 4],
  ['energy-monitor', 'north-london', 'Home energy monitor', 'Sustainability Equipment', 'Understand what your appliances use and discover where you can save energy.', 3],
  ['ladder', 'riverside', 'Folding step ladder', 'Tool', 'A sturdy, compact ladder for reaching those just-out-of-reach spaces. Indoor use.', 5],
  ['garden-kit', 'southbank', 'Community garden kit', 'Sustainability Equipment', 'Hand tools, a watering can and everything you need for a greener weekend.', 6],
  ['pressure-washer', 'riverside', 'Compact pressure washer', 'Tool', 'Give outdoor surfaces a fresh start with this easy-to-use cleaning kit.', 2],
  ['thermal-camera', 'southbank', 'Thermal inspection camera', 'Sustainability Equipment', 'Spot heat loss around windows and doors before planning home improvements.', 2],
];
export const sampleEquipment: CatalogueItem[] = equipment.map(([id, libraryId, name, category, description, capacity]) => ({ id, libraryId, name, category, description, status: 'active', version: 1, library: sampleLibraries.find(l => l.id === libraryId)!, stock: DATES.map(date => ({ equipmentId: id, date, capacity, reserved: 0 })) }));
