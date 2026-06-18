import { db } from '@infrasuite/firebase';

export interface License {
  empresaId: string;
  plan: 'BASIC' | 'PRO' | 'ENTERPRISE';
  vencimiento: string;
}

export const getCompanyLicense = async (empresaId: string): Promise<License | null> => {
  const licenses = await db.getDocs('licenses');
  return licenses.find((l) => l.empresaId === empresaId) || null;
};

export const getCompanyModules = async (empresaId: string): Promise<string[]> => {
  const mappings = await db.getDocs('company_modules');
  return mappings
    .filter((m) => m.empresaId === empresaId)
    .map((m) => m.moduloId);
};

export const isModuleActiveForCompany = async (
  empresaId: string,
  moduloId: string
): Promise<boolean> => {
  const activeModules = await getCompanyModules(empresaId);
  return activeModules.includes(moduloId);
};

export const activateModuleForCompany = async (
  empresaId: string,
  moduloId: string
): Promise<void> => {
  const mappings = await db.getDocs('company_modules');
  const alreadyActive = mappings.some(
    (m) => m.empresaId === empresaId && m.moduloId === moduloId
  );
  if (!alreadyActive) {
    await db.addDoc('company_modules', { empresaId, moduloId });
  }
};

export const deactivateModuleForCompany = async (
  empresaId: string,
  moduloId: string
): Promise<void> => {
  const mappings = await db.getDocs('company_modules');
  const record = mappings.find(
    (m) => m.empresaId === empresaId && m.moduloId === moduloId
  );
  if (record) {
    await db.deleteDoc('company_modules', record.id);
  }
};
