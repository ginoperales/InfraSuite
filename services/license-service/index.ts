import { db } from '@infrasuite/firebase';

export interface License {
  empresaId: string;
  plan: 'BASIC' | 'PRO' | 'ENTERPRISE';
  vencimiento: string;
}

export const getCompanyLicense = async (empresaId: string): Promise<License | null> => {
  const licenses = await db.getDocs('licenses');
  const found = licenses.find((l) => l.empresaId === empresaId || l.empresa_id === empresaId);
  if (!found) return null;
  return {
    empresaId: found.empresaId || found.empresa_id || empresaId,
    plan: found.plan || 'PRO',
    vencimiento: found.vencimiento || '2028-12-31'
  };
};

export const getCompanyModules = async (empresaId: string): Promise<string[]> => {
  const mappings = await db.getDocs('company_modules');
  const targetCompany = empresaId || 'c1';

  const list = mappings
    .filter((m) => m.empresaId === targetCompany || m.empresa_id === targetCompany)
    .map((m) => (m.moduloId || m.modulo_id || '').toUpperCase());

  // Fallback: If no custom mapping in database yet, active default modules
  if (list.length === 0) {
    return ['INFRACOST', 'INFRACOST_PRO', 'INFRADOCS', 'INFRAGEO', 'INFRACONTROL', 'INFRAFIELD', 'INFRAAI', 'INFRAADMIN', 'INFRASEACE', 'INFRASTRUCT'];
  }
  return list;
};

export const isModuleActiveForCompany = async (
  empresaId: string,
  moduloId: string
): Promise<boolean> => {
  const activeModules = await getCompanyModules(empresaId);
  return activeModules.includes(moduloId.toUpperCase());
};

export const activateModuleForCompany = async (
  empresaId: string,
  moduloId: string
): Promise<void> => {
  const targetCompany = empresaId || 'c1';
  const upperModulo = moduloId.toUpperCase();
  const mappings = await db.getDocs('company_modules');
  
  const alreadyActive = mappings.some(
    (m) => (m.empresaId === targetCompany || m.empresa_id === targetCompany) && 
           ((m.moduloId || m.modulo_id || '').toUpperCase() === upperModulo)
  );

  if (!alreadyActive) {
    const id = `${targetCompany}_${upperModulo}`;
    await db.addDoc('company_modules', {
      id,
      empresa_id: targetCompany,
      empresaId: targetCompany,
      modulo_id: upperModulo,
      moduloId: upperModulo
    });
  }
};

export const deactivateModuleForCompany = async (
  empresaId: string,
  moduloId: string
): Promise<void> => {
  const targetCompany = empresaId || 'c1';
  const upperModulo = moduloId.toUpperCase();
  const mappings = await db.getDocs('company_modules');
  
  const record = mappings.find(
    (m) => (m.empresaId === targetCompany || m.empresa_id === targetCompany) && 
           ((m.moduloId || m.modulo_id || '').toUpperCase() === upperModulo)
  );

  if (record && record.id) {
    await db.deleteDoc('company_modules', record.id);
  }
};
