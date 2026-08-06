import React, { useState, useEffect } from 'react';
import { Modal, Input, Select, Button } from '@infrasuite/shared';
import type { Budget, Partida, Insumo, PartidaColumnKey, PiePresupuestoRow } from './types';
import { LiteIcon } from './BudgetEditorLite';

// Common CSS styles
export const thStyle: React.CSSProperties = {
  padding: '12px 16px',
  fontSize: '0.76rem',
  textTransform: 'uppercase',
  borderBottom: '1px solid var(--border-color)'
};

export const tdStyle: React.CSSProperties = {
  padding: '12px 16px',
  borderBottom: '1px solid var(--modal-divider-color)',
  color: 'var(--text-secondary)'
};

export const tableInputStyle: React.CSSProperties = {
  background: 'var(--modal-input-bg)',
  border: '1px solid var(--border-color)',
  color: 'var(--text-primary)',
  padding: '4px 8px',
  width: '100%',
  maxWidth: '90px',
  borderRadius: '4px',
  fontSize: '0.82rem',
  outline: 'none',
  textAlign: 'right'
};

export const dgInputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--modal-input-bg)',
  border: '1px solid var(--border-color)',
  color: 'var(--text-primary)',
  padding: '10px 14px',
  borderRadius: '4px',
  fontSize: '0.88rem',
  fontFamily: 'var(--font-sans)',
  outline: 'none'
};

export const menuItemStyle: React.CSSProperties = {
  width: '100%',
  background: 'none',
  border: 'none',
  textAlign: 'left',
  padding: '10px 16px',
  color: 'var(--text-secondary)',
  fontSize: '0.88rem',
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
  transition: 'all 0.15s',
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
};

// Create Budget Modal
export const CreateBudgetModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  nombre: string;
  setNombre: (v: string) => void;
  cliente: string;
  setCliente: (v: string) => void;
  fechaBase: string;
  setFechaBase: (v: string) => void;
  grupo: string;
  setGrupo: (v: string) => void;
  groups: string[];
}> = ({ isOpen, onClose, onSubmit, nombre, setNombre, cliente, setCliente, fechaBase, setFechaBase, grupo, setGrupo, groups }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Crear Nuevo Presupuesto">
      <form onSubmit={onSubmit} className="login-form">
        <Input
          label="Nombre del Presupuesto *"
          placeholder="Ej. CAMBIO DE COBERTURA DE CUMBRERA"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
        <Input
          label="Cliente / Entidad"
          placeholder="Ej. GOBIERNO REGIONAL DE UCAYALI"
          value={cliente}
          onChange={(e) => setCliente(e.target.value)}
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Input
            type="date"
            label="Fecha Base *"
            value={fechaBase}
            onChange={(e) => setFechaBase(e.target.value)}
            required
          />
          <Select
            label="Grupo"
            value={grupo}
            onChange={(e: any) => setGrupo(e.target.value)}
            options={groups.filter(g => g !== 'TODOS LOS PRESUPUESTOS').map(g => ({ value: g, label: g }))}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
          <Button type="button" variant="secondary" onClick={onClose} style={{ flex: 1 }}>
            Cancelar
          </Button>
          <Button type="submit" style={{ flex: 1, background: 'var(--grad-primary)', border: 'none' }}>
            Crear Presupuesto
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// Edit Budget Modal
export const EditBudgetModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  nombre: string;
  setNombre: (v: string) => void;
  cliente: string;
  setCliente: (v: string) => void;
  fechaBase: string;
  setFechaBase: (v: string) => void;
  grupo: string;
  setGrupo: (v: string) => void;
  groups: string[];
}> = ({ isOpen, onClose, onSubmit, nombre, setNombre, cliente, setCliente, fechaBase, setFechaBase, grupo, setGrupo, groups }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Modificar Datos Generales">
      <form onSubmit={onSubmit} className="login-form">
        <Input
          label="Nombre del Presupuesto *"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
        <Input
          label="Cliente / Entidad"
          value={cliente}
          onChange={(e) => setCliente(e.target.value)}
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Input
            type="date"
            label="Fecha Base *"
            value={fechaBase}
            onChange={(e) => setFechaBase(e.target.value)}
            required
          />
          <Select
            label="Grupo"
            value={grupo}
            onChange={(e: any) => setGrupo(e.target.value)}
            options={groups.filter(g => g !== 'TODOS LOS PRESUPUESTOS').map(g => ({ value: g, label: g }))}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
          <Button type="button" variant="secondary" onClick={onClose} style={{ flex: 1 }}>
            Cancelar
          </Button>
          <Button type="submit" style={{ flex: 1 }}>
            Guardar Cambios
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// Add Insumo Modal
export const AddInsumoModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  insumoNombre: string;
  setInsumoNombre: (v: string) => void;
  insumoUnidad: string;
  setInsumoUnidad: (v: string) => void;
  insumoCuadrilla: string;
  setInsumoCuadrilla: (v: string) => void;
  insumoPU: string;
  setInsumoPU: (v: string) => void;
  insumoTipo: 'MO' | 'MT' | 'EQ' | 'SC' | 'SP';
  setInsumoTipo: (v: 'MO' | 'MT' | 'EQ' | 'SC' | 'SP') => void;
  showSuggestions: boolean;
  setShowSuggestions: (v: boolean) => void;
  matchingSuggestions: any[];
  handleSelectSuggestion: (item: any) => void;
  handleCreateNewInsumoOption: () => void;
}> = ({
  isOpen,
  onClose,
  onSubmit,
  insumoNombre,
  setInsumoNombre,
  insumoUnidad,
  setInsumoUnidad,
  insumoCuadrilla,
  setInsumoCuadrilla,
  insumoPU,
  setInsumoPU,
  insumoTipo,
  setInsumoTipo,
  showSuggestions,
  setShowSuggestions,
  matchingSuggestions,
  handleSelectSuggestion,
  handleCreateNewInsumoOption
}) => {
  const isManualToolsInput =
    insumoUnidad.trim().toUpperCase() === '%MO' ||
    insumoNombre.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().includes('HERRAMIENTAS MANUALES');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Agregar Insumo al Análisis (APU)">
      <form onSubmit={onSubmit} className="login-form">
        <div style={{ position: 'relative' }}>
          <Input
            label="Descripción del Insumo *"
            placeholder="Ej. PEON, ALAMBRE NEGRO, OPERARIO"
            value={insumoNombre}
            onChange={(e) => {
              setInsumoNombre(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => {
              setTimeout(() => setShowSuggestions(false), 200);
            }}
            required
          />
          {showSuggestions && insumoNombre.trim() !== '' && (
            <div 
              className="autocomplete-dropdown"
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: 'var(--modal-bg)',
                border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
                borderRadius: '6px',
                maxHeight: '200px',
                overflowY: 'auto',
                zIndex: 1000,
                boxShadow: 'var(--modal-shadow)',
                marginTop: '4px'
              }}
            >
              {matchingSuggestions.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectSuggestion(item)}
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    borderBottom: '1px solid var(--modal-divider-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                  className="autocomplete-item"
                >
                  <div>
                    <strong style={{ color: 'var(--text-primary)' }}>{item.nombre}</strong>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginLeft: '8px' }}>
                      ({item.unidad})
                    </span>
                    {(item.codigo || item.sourceLabel) && (
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                        {[item.codigo, item.sourceLabel].filter(Boolean).join(' · ')}
                      </div>
                    )}
                  </div>
                  <span style={{
                    fontSize: '0.72rem',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'var(--modal-panel-bg)',
                    color: 'var(--text-secondary)'
                  }}>
                    {item.tipo}
                  </span>
                </div>
              ))}

              {!matchingSuggestions.some(item => item.nombre.toLowerCase() === insumoNombre.trim().toLowerCase()) && (
                <div
                  onClick={handleCreateNewInsumoOption}
                  style={{
                    padding: '10px 12px',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    background: 'rgba(0, 240, 255, 0.05)',
                    color: '#00f0ff',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  className="autocomplete-create-item"
                >
                  ✨ Crear nuevo insumo "{insumoNombre.trim().toUpperCase()}"
                </div>
              )}
            </div>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Select
            label="Tipo de Recurso"
            value={insumoTipo}
            onChange={(e: any) => setInsumoTipo(e.target.value)}
            options={[
              { value: 'MO', label: 'Mano de Obra (MO)' },
              { value: 'MT', label: 'Materiales (MT)' },
              { value: 'EQ', label: 'Equipos (EQ)' },
              { value: 'SC', label: 'Subcontratos (SC)' },
              { value: 'SP', label: 'Subpartidas (SP)' }
            ]}
          />
          <Input
            label="Unidad *"
            placeholder="Ej. HH, M3, GLB, KG"
            value={insumoUnidad}
            onChange={(e) => setInsumoUnidad(e.target.value)}
            required
            list="unidades-list"
          />
          <datalist id="unidades-list">
            <option value="HH" />
            <option value="M3" />
            <option value="M2" />
            <option value="ML" />
            <option value="GLB" />
            <option value="KG" />
            <option value="UND" />
            <option value="PAR" />
            <option value="%MO" />
            <option value="MES" />
            <option value="DIA" />
            <option value="GAL" />
          </datalist>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Input
            type="number"
            step="0.0001"
            label="Cuadrilla / Cantidad *"
            value={insumoCuadrilla}
            onChange={(e) => setInsumoCuadrilla(e.target.value)}
            required
          />
          <Input
            type="number"
            step="0.01"
            label={isManualToolsInput ? "Precio Unitario (auto MO)" : "Precio Unitario (PU) *"}
            placeholder={isManualToolsInput ? "Calculado desde Mano de Obra" : undefined}
            value={isManualToolsInput ? '' : insumoPU}
            onChange={(e) => {
              if (!isManualToolsInput) setInsumoPU(e.target.value);
            }}
            disabled={isManualToolsInput}
            required={!isManualToolsInput}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
          <Button type="button" variant="secondary" onClick={onClose} style={{ flex: 1 }}>
            Cancelar
          </Button>
          <Button type="submit" style={{ flex: 1, background: 'var(--grad-primary)', border: 'none' }}>
            Insertar Insumo
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// Add Partida Modal
export const AddPartidaModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  partidaNombre: string;
  setPartidaNombre: (v: string) => void;
  partidaUnidad: string;
  setPartidaUnidad: (v: string) => void;
  partidaMetrado: string;
  setPartidaMetrado: (v: string) => void;
  partidaRendimiento: string;
  setPartidaRendimiento: (v: string) => void;
  partidaEsTitulo: boolean;
}> = ({
  isOpen,
  onClose,
  onSubmit,
  partidaNombre,
  setPartidaNombre,
  partidaUnidad,
  setPartidaUnidad,
  partidaMetrado,
  setPartidaMetrado,
  partidaRendimiento,
  setPartidaRendimiento,
  partidaEsTitulo
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={partidaEsTitulo ? "Agregar Nuevo Título" : "Agregar Nueva Partida"}>
      <form onSubmit={onSubmit} className="login-form">
        <Input
          label={partidaEsTitulo ? "Nombre del Título *" : "Descripción de la Partida *"}
          placeholder={partidaEsTitulo ? "Ej. OBRAS DE MITIGACION" : "Ej. Trazo y replanteo preliminar"}
          value={partidaNombre}
          onChange={(e) => setPartidaNombre(e.target.value)}
          required
        />

        {!partidaEsTitulo && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Input
                label="Unidad *"
                placeholder="Ej. M2, GLB, M3"
                value={partidaUnidad}
                onChange={(e) => setPartidaUnidad(e.target.value)}
                required
              />
              <Input
                type="number"
                step="0.01"
                label="Metrado *"
                value={partidaMetrado}
                onChange={(e) => setPartidaMetrado(e.target.value)}
                required
              />
            </div>
            <Input
              type="number"
              step="0.1"
              label="Rendimiento Base *"
              value={partidaRendimiento}
              onChange={(e) => setPartidaRendimiento(e.target.value)}
              required
            />
          </>
        )}

        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
          <Button type="button" variant="secondary" onClick={onClose} style={{ flex: 1 }}>
            Cancelar
          </Button>
          <Button type="submit" style={{ flex: 1 }}>
            Insertar Elemento
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// Datos Generales Modal
export const DatosGeneralesModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  activeBudget: Budget | null;
  dgActiveTab: 'general' | 'subpresupuestos';
  setDgActiveTab: (v: 'general' | 'subpresupuestos') => void;
  dgGrupo: string;
  setDgGrupo: (v: string) => void;
  dgPresupuesto: string;
  setDgPresupuesto: (v: string) => void;
  dgCliente: string;
  setDgCliente: (v: string) => void;
  dgDireccion: string;
  setDgDireccion: (v: string) => void;
  dgDistrito: string;
  setDgDistrito: (v: string) => void;
  dgProvincia: string;
  setDgProvincia: (v: string) => void;
  dgDepartamento: string;
  setDgDepartamento: (v: string) => void;
  dgFechaBase: string;
  setDgFechaBase: (v: string) => void;
  dgJornada: number;
  setDgJornada: (v: number) => void;
  dgMoneda: 'SOLES' | 'DOLARES';
  setDgMoneda: (v: 'SOLES' | 'DOLARES') => void;
  dgSubPresupuestos: string[];
  setDgSubPresupuestos: (v: string[]) => void;
  newSubPresupuesto: string;
  setNewSubPresupuesto: (v: string) => void;
  groups: string[];
  onSave: () => void;
}> = ({
  isOpen,
  onClose,
  activeBudget,
  dgActiveTab,
  setDgActiveTab,
  dgGrupo,
  setDgGrupo,
  dgPresupuesto,
  setDgPresupuesto,
  dgCliente,
  setDgCliente,
  dgDireccion,
  setDgDireccion,
  dgDistrito,
  setDgDistrito,
  dgProvincia,
  setDgProvincia,
  dgDepartamento,
  setDgDepartamento,
  dgFechaBase,
  setDgFechaBase,
  dgJornada,
  setDgJornada,
  dgMoneda,
  setDgMoneda,
  dgSubPresupuestos,
  setDgSubPresupuestos,
  newSubPresupuesto,
  setNewSubPresupuesto,
  groups,
  onSave
}) => {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Editar Datos Generales"
    >
      {/* Tabs header */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '16px', gap: '8px' }}>
        <button
          onClick={() => setDgActiveTab('general')}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: dgActiveTab === 'general' ? '2px solid var(--color-primary)' : '2px solid transparent',
            color: dgActiveTab === 'general' ? 'var(--color-primary)' : 'var(--text-secondary)',
            padding: '8px 16px',
            fontSize: '0.85rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
            transition: 'all 0.2s'
          }}
        >
          General
        </button>
        <button
          onClick={() => setDgActiveTab('subpresupuestos')}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: dgActiveTab === 'subpresupuestos' ? '2px solid var(--color-primary)' : '2px solid transparent',
            color: dgActiveTab === 'subpresupuestos' ? 'var(--color-primary)' : 'var(--text-secondary)',
            padding: '8px 16px',
            fontSize: '0.85rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
            transition: 'all 0.2s'
          }}
        >
          Sub Presupuestos
        </button>
      </div>

      {/* Modal Body content */}
      <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '4px', marginBottom: '24px' }}>
        {dgActiveTab === 'general' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            
            {/* Grupo select */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Grupo</label>
              <select
                value={dgGrupo}
                onChange={(e) => setDgGrupo(e.target.value)}
                style={{ ...dgInputStyle, cursor: 'pointer' }}
              >
                {groups.map(g => (
                  <option key={g} value={g} style={{ background: '#121622' }}>{g}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Presupuesto</label>
              <input
                type="text"
                value={dgPresupuesto}
                onChange={(e) => setDgPresupuesto(e.target.value)}
                style={dgInputStyle}
                placeholder="Nombre del presupuesto..."
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Cliente / Entidad</label>
              <input
                type="text"
                value={dgCliente}
                onChange={(e) => setDgCliente(e.target.value)}
                style={dgInputStyle}
                placeholder="Nombre del cliente..."
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Fecha Base</label>
                <input
                  type="date"
                  value={dgFechaBase}
                  onChange={(e) => setDgFechaBase(e.target.value)}
                  style={dgInputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Jornada Laboral (Horas)</label>
                <input
                  type="number"
                  value={dgJornada}
                  onChange={(e) => setDgJornada(parseInt(e.target.value) || 8)}
                  style={dgInputStyle}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Moneda</label>
                <select
                  value={dgMoneda}
                  onChange={(e) => setDgMoneda(e.target.value as 'SOLES' | 'DOLARES')}
                  style={{ ...dgInputStyle, cursor: 'pointer' }}
                >
                  <option value="SOLES" style={{ background: '#121622' }}>NUEVOS SOLES (S/)</option>
                  <option value="DOLARES" style={{ background: '#121622' }}>DÓLARES AMERICANOS ($)</option>
                </select>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 'bold', color: 'var(--text-secondary)', display: 'block', marginBottom: '12px' }}>Ubicación Geográfica</span>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Departamento</label>
                  <input
                    type="text"
                    value={dgDepartamento}
                    onChange={(e) => setDgDepartamento(e.target.value)}
                    style={{ ...dgInputStyle, padding: '8px 12px', fontSize: '0.8rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Provincia</label>
                  <input
                    type="text"
                    value={dgProvincia}
                    onChange={(e) => setDgProvincia(e.target.value)}
                    style={{ ...dgInputStyle, padding: '8px 12px', fontSize: '0.8rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Distrito</label>
                  <input
                    type="text"
                    value={dgDistrito}
                    onChange={(e) => setDgDistrito(e.target.value)}
                    style={{ ...dgInputStyle, padding: '8px 12px', fontSize: '0.8rem' }}
                  />
                </div>
              </div>

              <div style={{ marginTop: '12px' }}>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Dirección / Localidad</label>
                <input
                  type="text"
                  value={dgDireccion}
                  onChange={(e) => setDgDireccion(e.target.value)}
                  style={{ ...dgInputStyle, padding: '8px 12px', fontSize: '0.8rem' }}
                />
              </div>
            </div>

          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={newSubPresupuesto}
                onChange={(e) => setNewSubPresupuesto(e.target.value)}
                placeholder="Nombre del nuevo sub presupuesto..."
                style={{ ...dgInputStyle, flexGrow: 1 }}
              />
              <button
                onClick={() => {
                  if (!newSubPresupuesto.trim()) return;
                  setDgSubPresupuestos([...dgSubPresupuestos, newSubPresupuesto.trim().toUpperCase()]);
                  setNewSubPresupuesto('');
                }}
                style={{
                  background: 'var(--color-primary)',
                  border: 'none',
                  color: 'var(--text-on-primary)',
                  padding: '10px 18px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '0.85rem'
                }}
              >
                Agregar
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid var(--border-color)', padding: '12px', borderRadius: '6px', background: 'var(--modal-panel-bg)' }}>
              {dgSubPresupuestos.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '12px' }}>No hay sub presupuestos agregados.</div>
              ) : (
                dgSubPresupuestos.map((sub, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--modal-bg)', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '600' }}>{sub}</span>
                    <button
                      onClick={() => setDgSubPresupuestos(dgSubPresupuestos.filter((_, i) => i !== idx))}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--color-danger)',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      Eliminar
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal Footer */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px',
        marginTop: '12px'
      }}>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)',
            padding: '10px 24px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.88rem'
          }}
        >
          Cancelar
        </button>
        <button
          onClick={onSave}
          style={{
            background: 'var(--color-primary)',
            border: 'none',
            color: 'var(--text-on-primary)',
            padding: '10px 24px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '0.88rem'
          }}
        >
          Aceptar
        </button>
      </div>
    </Modal>
  );
};

// General Expenses (Gastos Generales) Modal
export const GastosGeneralesModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  ggTipo: 'FIJOS' | 'VARIABLES';
  setGgTipo: (v: 'FIJOS' | 'VARIABLES') => void;
  ggFijosItems: any[];
  setGgFijosItems: (v: any[]) => void;
  ggVariablesItems: any[];
  setGgVariablesItems: (v: any[]) => void;
  getBudgetCD: (b: Budget | null) => number;
  activeBudget: Budget | null;
}> = ({ isOpen, onClose, ggTipo, setGgTipo, ggFijosItems, setGgVariablesItems, ggVariablesItems, setGgFijosItems, getBudgetCD, activeBudget }) => {
  const cd = activeBudget ? getBudgetCD(activeBudget) : 0;
  const items = ggTipo === 'FIJOS' ? ggFijosItems : ggVariablesItems;
  const totalGG = items.reduce((sum, row) => sum + (row.parcial || 0), 0);
  const pgg = cd > 0 ? (totalGG / cd) * 100 : 0;

  const handleUpdateItem = (index: number, field: string, val: any) => {
    const copy = [...items];
    copy[index] = { ...copy[index], [field]: val };
    if (ggTipo === 'FIJOS') {
      setGgFijosItems(copy);
    } else {
      setGgVariablesItems(copy);
    }
  };

  const handleAddItem = () => {
    const nextItem = `${ggTipo === 'FIJOS' ? '01' : '02'}.${String(items.length + 1).padStart(2, '0')}`;
    const copy = [...items, { item: nextItem, titulo: 'NUEVO CONCEPTO', parcial: 0.0 }];
    if (ggTipo === 'FIJOS') {
      setGgFijosItems(copy);
    } else {
      setGgVariablesItems(copy);
    }
  };

  const handleDeleteRow = (index: number) => {
    const copy = items.filter((_, i) => i !== index);
    if (ggTipo === 'FIJOS') {
      setGgFijosItems(copy);
    } else {
      setGgVariablesItems(copy);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Gastos Generales"
    >
      <style>{`
        .modal-overlay:has(.gg-container) .modal-content {
          max-width: 800px !important;
          width: 95% !important;
          padding: 0 !important;
          overflow: hidden !important;
          background: var(--modal-bg) !important;
          border: 1px solid var(--border-color) !important;
          box-shadow: var(--modal-shadow) !important;
        }
        .gg-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .gg-tabs {
          display: flex;
          gap: 8px;
          padding: 12px 20px 0 20px;
          background: var(--modal-panel-bg);
          border-bottom: 1px solid var(--border-color);
        }
        .gg-tab-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-size: 0.85rem;
          font-weight: bold;
          cursor: pointer;
          padding: 8px 16px;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
        }
        .gg-tab-btn.active {
          color: var(--color-primary);
          border-bottom-color: var(--color-primary);
          text-shadow: 0 0 8px rgba(0, 240, 255, 0.3);
        }
      `}</style>

      <div className="gg-container">
        {/* Tabs */}
        <div className="gg-tabs">
          <button 
            className={`gg-tab-btn ${ggTipo === 'FIJOS' ? 'active' : ''}`}
            onClick={() => setGgTipo('FIJOS')}
          >
            Gastos Fijos
          </button>
          <button 
            className={`gg-tab-btn ${ggTipo === 'VARIABLES' ? 'active' : ''}`}
            onClick={() => setGgTipo('VARIABLES')}
          >
            Gastos Variables
          </button>
        </div>

        <div style={{ padding: '0 20px 20px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Summary Panel */}
          <div style={{
            background: 'var(--modal-panel-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '12px 18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Costo Directo Base</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-primary)', fontFamily: 'monospace', marginTop: '2px' }}>S/ {cd.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Gastos {ggTipo === 'FIJOS' ? 'Fijos' : 'Variables'}</div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '4px'
              }}>
                <div style={{
                  background: 'rgba(0, 240, 255, 0.08)',
                  border: '1px solid rgba(0, 240, 255, 0.3)',
                  padding: '4px 12px',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  fontWeight: 'bold',
                  color: 'var(--color-primary)'
                }}>
                  <span>PGG = {pgg.toFixed(4)}%</span>
                  <span style={{ opacity: 0.5, margin: '0 8px' }}>|</span>
                  <span>GG = S/ {totalGG.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>

          {/* General Expenses Table */}
          <div style={{
            maxHeight: '320px',
            overflowY: 'auto',
            borderRadius: '6px',
            border: '1px solid var(--border-color)',
            background: 'var(--modal-table-bg)'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead style={{
                position: 'sticky',
                top: 0,
                background: 'var(--bg-surface-elevated)',
                borderBottom: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                fontWeight: 600,
                zIndex: 10
              }}>
                <tr>
                  <th style={{ ...thStyle, width: '15%' }}>Item</th>
                  <th style={{ ...thStyle, width: '60%' }}>Título / Concepto</th>
                  <th style={{ ...thStyle, width: '20%' }}>Parcial</th>
                  <th style={{ ...thStyle, width: '5%', textAlign: 'center' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row, idx) => {
                  const isTitle = row.titulo.startsWith('===');
                  return (
                    <tr 
                      key={idx} 
                      style={{ 
                        borderBottom: '1px solid var(--border-color)',
                        background: isTitle ? 'rgba(139, 92, 246, 0.02)' : 'transparent'
                      }}
                    >
                      <td style={tdStyle}>
                        <input
                          type="text"
                          value={row.item}
                          onChange={(e) => handleUpdateItem(idx, 'item', e.target.value)}
                          placeholder="..."
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-primary)',
                            outline: 'none',
                            fontFamily: 'monospace',
                            width: '100%',
                            fontSize: '0.85rem'
                          }}
                        />
                      </td>
                      <td style={tdStyle}>
                        <input
                          type="text"
                          value={row.titulo}
                          onChange={(e) => handleUpdateItem(idx, 'titulo', e.target.value)}
                          placeholder="Escriba el concepto..."
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: isTitle ? 'var(--color-secondary)' : 'var(--text-primary)',
                            outline: 'none',
                            fontFamily: 'var(--font-sans)',
                            fontWeight: isTitle ? 'bold' : 500,
                            width: '100%',
                            fontSize: '0.85rem'
                          }}
                        />
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>S/</span>
                          <input
                            type="number"
                            step="0.01"
                            value={row.parcial}
                            onChange={(e) => handleUpdateItem(idx, 'parcial', parseFloat(e.target.value) || 0)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--color-primary)',
                              outline: 'none',
                              fontFamily: 'monospace',
                              fontWeight: 600,
                              width: '100%',
                              fontSize: '0.85rem'
                            }}
                          />
                        </div>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <button
                          onClick={() => handleDeleteRow(idx)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--color-danger)',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '30px',
                            height: '30px',
                            borderRadius: '6px',
                            transition: 'transform 0.1s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
                          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                          <LiteIcon name="trash" size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Bottom bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            background: 'var(--modal-panel-bg)',
            borderRadius: '8px',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Formato:</span>
              <select
                style={{
                  background: 'var(--modal-input-bg)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  borderRadius: '4px',
                  padding: '6px 12px',
                  fontSize: '0.8rem',
                  fontFamily: 'var(--font-sans)',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option>Estándar</option>
                <option>Desglosado</option>
              </select>
            </div>

            <button
              onClick={handleAddItem}
              style={{
                background: 'rgba(0, 240, 255, 0.1)',
                border: '1px solid rgba(0, 240, 255, 0.35)',
                color: 'var(--color-primary)',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 240, 255, 0.2)';
                e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 240, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0, 240, 255, 0.1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <LiteIcon name="plus" size={16} />
              Agregar item
            </button>
          </div>

          {/* Close Button Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
            <button
              onClick={onClose}
              style={{
                background: 'var(--modal-bg)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                padding: '10px 24px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.88rem',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

// Pie Presupuesto Modal
export const PiePresupuestoModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  activeBudget: Budget | null;
  pieRows: PiePresupuestoRow[];
  setPieRows: (v: PiePresupuestoRow[]) => void;
  getBudgetCD: (b: Budget | null) => number;
}> = ({ isOpen, onClose, activeBudget, pieRows, setPieRows, getBudgetCD }) => {
  const cd = activeBudget ? getBudgetCD(activeBudget) : 0;
  const values: { [key: string]: number } = { CD: cd };
  
  const calculatedRows = pieRows.map(row => {
    if (row.variable === 'CD') {
      return { ...row, valor: cd };
    }
    let val = 0;
    try {
      let expr = row.formula;
      Object.keys(values).forEach(key => {
        const regex = new RegExp(`\\b${key}\\b`, 'g');
        expr = expr.replace(regex, values[key].toString());
      });
      if (expr.trim()) {
        const cleanExpr = expr.replace(/[^0-9.+\-*/() ]/g, '');
        val = Function(`"use strict"; return (${cleanExpr})`)();
      }
    } catch (e) {
      val = 0;
    }
    values[row.variable] = val;
    return { ...row, valor: val };
  });

  const handleUpdateRow = (index: number, field: keyof PiePresupuestoRow, val: any) => {
    const copy = [...pieRows];
    copy[index] = { ...copy[index], [field]: val };
    setPieRows(copy);
  };

  const handleAddRow = () => {
    const copy = [...pieRows];
    copy.splice(copy.length - 1, 0, {
      variable: 'CARGO',
      descripcion: 'NUEVO CONCEPTO',
      formula: 'CD * 0.05',
      iu: '39',
      resaltar: false,
      ocultarEnPdf: false
    });
    setPieRows(copy);
  };

  const handleDeleteRow = (index: number) => {
    const row = pieRows[index];
    if (row.variable === 'CD' || row.variable === 'TOTAL') {
      alert('Las variables de COSTO DIRECTO y TOTAL no se pueden eliminar.');
      return;
    }
    setPieRows(pieRows.filter((_, i) => i !== index));
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`Pie del Sub Presupuesto: ${activeBudget?.subPresupuestos[0] || 'Sub Presupuesto 1'}`}
    >
      <style>{`
        .modal-overlay:has(.pie-presupuesto-container) .modal-content {
          max-width: 1080px !important;
          width: 95% !important;
          padding: 0 !important;
          overflow: hidden !important;
          background: var(--modal-bg) !important;
          border: 1px solid var(--border-color) !important;
          box-shadow: var(--modal-shadow) !important;
        }
        .pie-presupuesto-container {
          display: flex;
          flex-direction: column;
          gap: 0px;
        }
        .pie-presupuesto-toolbar {
          display: flex;
          gap: 20px;
          padding: 12px 20px;
          background: var(--modal-panel-bg);
          border-bottom: 1px solid var(--border-color);
        }
        .pie-toolbar-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          padding: 4px 8px;
          transition: all 0.2s;
          font-family: var(--font-sans);
        }
        .pie-toolbar-btn:hover {
          color: var(--color-primary);
          text-shadow: 0 0 8px rgba(0, 240, 255, 0.5);
        }
        .pie-presupuesto-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 0.85rem;
        }
        .pie-presupuesto-table th {
          background: var(--modal-panel-bg);
          color: var(--text-secondary);
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.76rem;
          padding: 10px 12px;
          border-bottom: 1px solid var(--border-color);
          border-right: 1px solid var(--modal-divider-color);
        }
        .pie-presupuesto-table td {
          padding: 4px 8px;
          border-bottom: 1px solid var(--modal-divider-color);
          border-right: 1px solid var(--modal-divider-color);
          color: var(--text-secondary);
        }
        .pie-presupuesto-table input[type="text"] {
          background: transparent;
          border: 1px solid transparent;
          color: var(--text-primary);
          outline: none;
          padding: 6px 10px;
          font-size: 0.85rem;
          width: 100%;
          transition: all 0.15s;
          box-sizing: border-box;
        }
        .pie-presupuesto-table input[type="text"]:focus {
          border-color: rgba(0, 240, 255, 0.4);
          background: rgba(0, 240, 255, 0.03);
          border-radius: 4px;
        }
        .pie-presupuesto-table input[type="text"]:hover:not(:focus):not(:disabled) {
          border-color: var(--border-color-focus);
          background: var(--modal-panel-hover-bg);
          border-radius: 4px;
        }
        .pie-presupuesto-table input:disabled {
          color: var(--text-muted) !important;
          cursor: not-allowed;
        }
        .pie-presupuesto-table input[type="checkbox"] {
          accent-color: var(--color-primary);
        }
        .pie-agregar-row {
          display: flex;
          justifyContent: center;
          align-items: center;
          padding: 10px;
          background: var(--modal-panel-bg);
          border-bottom: 1px solid var(--border-color);
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-secondary);
          transition: all 0.15s;
        }
        .pie-agregar-row:hover {
          background: rgba(0, 240, 255, 0.03);
          color: var(--color-primary);
        }
      `}</style>

      <div className="pie-presupuesto-container">
        {/* Toolbar */}
        <div className="pie-presupuesto-toolbar">
          <button 
            className="pie-toolbar-btn"
            onClick={() => {
              alert('Fórmula de pie aplicada con éxito.');
              onClose();
            }}
          >
            Aplicar
          </button>
          <button 
            className="pie-toolbar-btn"
            onClick={() => alert('Parámetros insertados en la base de datos')}
          >
            Insertar
          </button>
          <button 
            className="pie-toolbar-btn"
            onClick={() => alert('Aplicado el mismo formato a todos los sub presupuestos')}
          >
            Aplicar a todos los sub presupuestos
          </button>
        </div>

        {/* Pie Table */}
        <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
          <table className="pie-presupuesto-table">
            <thead>
              <tr>
                <th style={{ width: '10%', textAlign: 'center' }}>Variable</th>
                <th style={{ width: '35%' }}>Descripción</th>
                <th style={{ width: '20%' }}>Fórmula</th>
                <th style={{ width: '14%', textAlign: 'right' }}>Valor</th>
                <th style={{ width: '7%', textAlign: 'center' }}>IU</th>
                <th style={{ width: '8%', textAlign: 'center' }}>Resaltar</th>
                <th style={{ width: '9%', textAlign: 'center' }}>Ocultar PDF</th>
                <th style={{ width: '4%', textAlign: 'center' }}></th>
              </tr>
            </thead>
            <tbody>
              {calculatedRows.map((row, idx) => {
                const isLocked = row.variable === 'CD';
                return (
                  <tr 
                    key={idx}
                    style={{
                      background: row.resaltar ? 'rgba(0, 240, 255, 0.03)' : 'transparent',
                      fontWeight: row.resaltar ? 'bold' : 'normal'
                    }}
                  >
                    {/* Variable */}
                    <td>
                      <input
                        type="text"
                        disabled={isLocked}
                        value={row.variable}
                        onChange={(e) => handleUpdateRow(idx, 'variable', e.target.value.toUpperCase())}
                        style={{
                          fontFamily: 'monospace',
                          fontWeight: 'bold',
                          textAlign: 'center'
                        }}
                      />
                    </td>

                    {/* Descripción */}
                    <td>
                      <input
                        type="text"
                        disabled={isLocked}
                        value={row.descripcion}
                        onChange={(e) => handleUpdateRow(idx, 'descripcion', e.target.value)}
                      />
                    </td>

                    {/* Fórmula */}
                    <td>
                      <input
                        type="text"
                        disabled={isLocked}
                        placeholder=""
                        value={row.formula}
                        onChange={(e) => handleUpdateRow(idx, 'formula', e.target.value)}
                        style={{
                          fontFamily: 'monospace',
                          color: 'var(--color-secondary)'
                        }}
                      />
                    </td>

                    {/* Valor */}
                    <td style={{ 
                      textAlign: 'right', 
                      color: row.resaltar ? 'var(--color-primary)' : 'var(--text-primary)', 
                      fontWeight: 'bold', 
                      fontFamily: 'monospace',
                      paddingRight: '12px'
                    }}>
                      S/ {row.valor.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* IU */}
                    <td style={{ textAlign: 'center' }}>
                      {!isLocked && row.variable !== 'TOTAL' && row.variable !== 'ST' && row.variable !== 'IGV' ? (
                        <input
                          type="text"
                          value={row.iu}
                          onChange={(e) => handleUpdateRow(idx, 'iu', e.target.value)}
                          style={{
                            textAlign: 'center',
                            fontFamily: 'monospace'
                          }}
                        />
                      ) : '-'}
                    </td>

                    {/* Resaltar? */}
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={row.resaltar}
                        disabled={isLocked}
                        onChange={(e) => handleUpdateRow(idx, 'resaltar', e.target.checked)}
                        style={{
                          width: '16px',
                          height: '16px',
                          cursor: isLocked ? 'not-allowed' : 'pointer'
                        }}
                      />
                    </td>

                    {/* Ocultar PDF */}
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={Boolean(row.ocultarEnPdf)}
                        onChange={(e) => handleUpdateRow(idx, 'ocultarEnPdf', e.target.checked)}
                        title="Ocultar esta fila al descargar PDF"
                        style={{
                          width: '16px',
                          height: '16px',
                          cursor: 'pointer'
                        }}
                      />
                    </td>

                    {/* Delete */}
                    <td style={{ textAlign: 'center' }}>
                      {!isLocked && row.variable !== 'TOTAL' && (
                        <button
                          onClick={() => handleDeleteRow(idx)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--color-danger)',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '30px',
                            height: '30px',
                            borderRadius: '6px'
                          }}
                        >
                          <LiteIcon name="trash" size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Bottom Add Row button (Matches screenshot style) */}
        <div className="pie-agregar-row" onClick={handleAddRow}>
          + Agregar
        </div>

        {/* Close Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 20px', background: 'var(--modal-panel-bg)' }}>
          <button
            onClick={onClose}
            style={{
              background: 'var(--modal-bg)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              padding: '8px 20px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              transition: 'all 0.2s ease'
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
};

// Formula Polinomica Modal
export const FormulaPolinomicaModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  activeBudget: Budget | null;
  formulaPolinomicaRows: any[];
  setFormulaPolinomicaRows: (v: any[]) => void;
}> = ({ isOpen, onClose, activeBudget, formulaPolinomicaRows, setFormulaPolinomicaRows }) => {
  const [activeTab, setActiveTab] = useState<'formula' | 'desagregado'>('formula');
  const sumCoef = formulaPolinomicaRows.reduce((sum, r) => sum + (r.coeficiente || 0), 0);
  const isCorrectSum = Math.abs(sumCoef - 1.000) < 0.001;

  const handleUpdateRow = (index: number, field: string, val: any) => {
    const copy = [...formulaPolinomicaRows];
    copy[index] = { ...copy[index], [field]: val };
    setFormulaPolinomicaRows(copy);
  };

  const indexMapping: Record<string, string> = {
    '02': 'Acero de Construcción Liso',
    '03': 'Acero de Construcción Corrugado',
    '04': 'Agregado Fino',
    '05': 'Agregado Grueso',
    '13': 'Asfalto',
    '17': 'Bloque y Ladrillo',
    '21': 'Cemento Portland Tipo I',
    '26': 'Cerrajería Nacional',
    '29': 'Ocre (Se reagrupó, cambió a índice 30)',
    '30': 'Dólar',
    '34': 'Gasolina',
    '37': 'Herramienta Manual',
    '39': 'Índice General de Precios al Consumidor (INEI)',
    '47': 'Mano de Obra (Incluye leyes sociales)'
  };

  const formattedRows = [
    { index: '02', name: 'Acero de Construcción Liso', symbol: 'AY', coefCalculado: 0.0096441060, coefDefinido: 0.010, pct: 100.00 },
    { index: '03', name: 'Acero de Construcción Corrugado', symbol: 'AZ', coefCalculado: 0.1061487259, coefDefinido: 0.106, pct: 100.00 },
    { index: '04', name: 'Agregado Fino', symbol: 'AG', coefCalculado: 0.000190490, coefDefinido: 0.000, pct: 100.00 },
    { index: '05', name: 'Agregado Grueso', symbol: 'AX', coefCalculado: 0.0565369339, coefDefinido: 0.057, pct: 100.00 },
    { index: '13', name: 'Asfalto', symbol: 'AS', coefCalculado: 0.0001697261, coefDefinido: 0.000, pct: 100.00 },
    { index: '17', name: 'Bloque y Ladrillo', symbol: 'BL', coefCalculado: 0.0024697639, coefDefinido: 0.002, pct: 100.00 },
    { index: '21', name: 'Cemento Portland Tipo I', symbol: 'CE', coefCalculado: 0.0847859905, coefDefinido: 0.085, pct: 100.00 },
    { index: '26', name: 'Cerrajería Nacional', symbol: 'CK', coefCalculado: 0.0007210825, coefDefinido: 0.001, pct: 100.00 },
    { index: '29', name: 'Ocre (Se reagrupó, cambió a índice 30)', symbol: 'OC', coefCalculado: 0.0021600888, coefDefinido: 0.002, pct: 100.00 },
    { index: '30', name: 'Dólar', symbol: 'DO', coefCalculado: 0.0107687732, coefDefinido: 0.011, pct: 100.00 },
    { index: '34', name: 'Gasolina', symbol: 'GA', coefCalculado: 0.0017598904, coefDefinido: 0.002, pct: 100.00 },
    { index: '37', name: 'Herramienta Manual', symbol: 'HM', coefCalculado: 0.0111147222, coefDefinido: 0.011, pct: 100.00 },
    { index: '39', name: 'Índice General de Precios al Consumidor (INEI)', symbol: 'IPC', coefCalculado: 0.2822380300, coefDefinido: 0.282, pct: 100.00 },
    { index: '47', name: 'Mano de Obra (Incluye leyes sociales)', symbol: 'MO', coefCalculado: 0.4310000000, coefDefinido: 0.431, pct: 100.00 }
  ];

  const desagregadoCols = [
    { id: '01', name: '01 Aceite' },
    { id: '02', name: '02 Acero Liso' },
    { id: '03', name: '03 Acero Corr.' },
    { id: '04', name: '04 Agregado F.' },
    { id: '05', name: '05 Agregado G.' },
    { id: '13', name: '13 Asfalto' },
    { id: '17', name: '17 Ladrillo' },
    { id: '21', name: '21 Cemento' },
    { id: '26', name: '26 Cerrajería' },
    { id: '29', name: '29 Ocre' },
    { id: '30', name: '30 Dólar' },
    { id: '34', name: '34 Gasolina' },
    { id: '37', name: '37 Herramienta' },
    { id: '39', name: '39 IPC' },
    { id: '47', name: '47 Mano de Obra' }
  ];

  const partidas = activeBudget?.partidas || [];
  
  const getUnifiedIndex = (insumo: any): string => {
    const name = insumo.nombre.toLowerCase();
    if (insumo.tipo === 'MO') return '47';
    if (insumo.tipo === 'EQ') {
      if (name.includes('herramienta') || name.includes('manual')) return '37';
      return '37';
    }
    if (name.includes('aceite') || name.includes('lubricante')) return '01';
    if (name.includes('acero liso') || name.includes('fierro liso') || name.includes('liso')) return '02';
    if (name.includes('acero') || name.includes('fierro') || name.includes('corrugado')) return '03';
    if (name.includes('arena') || name.includes('fino')) return '04';
    if (name.includes('piedra') || name.includes('grava') || name.includes('grueso') || name.includes('hormigon')) return '05';
    if (name.includes('asfalto')) return '13';
    if (name.includes('ladrillo') || name.includes('bloque')) return '17';
    if (name.includes('cemento')) return '21';
    if (name.includes('cerrajería') || name.includes('bisagra') || name.includes('clavo') || name.includes('alambre') || name.includes('perno')) return '26';
    if (name.includes('ocre')) return '29';
    if (name.includes('dólar') || name.includes('dolar')) return '30';
    if (name.includes('gasolina') || name.includes('petróleo') || name.includes('combustible')) return '34';
    if (name.includes('herramienta')) return '37';
    return '39';
  };

  const getInsumoBaseCantidad = (ins: any, rend: number) => {
    const explicitCantidad = typeof ins.cantidad === 'number' && Number.isFinite(ins.cantidad) ? ins.cantidad : null;
    if (ins.unidad === '%MO') return explicitCantidad ?? ins.cuadrilla;
    if (ins.tipo === 'MO') {
      return rend > 0 ? (ins.cuadrilla * 8) / rend : 0;
    }
    if (ins.tipo === 'EQ') {
      return explicitCantidad ?? (rend > 0 ? (ins.cuadrilla * 8) / rend : 0);
    }
    return explicitCantidad ?? ins.cuadrilla;
  };

  const getInsumoDesperdicio = (ins: any) => {
    const raw = typeof ins.desperdicio === 'number' && Number.isFinite(ins.desperdicio) ? ins.desperdicio : 0;
    return ins.tipo === 'MT' ? Math.max(0, raw) : 0;
  };

  const getInsumoCantidad = (ins: any, rend: number) => {
    const baseCantidad = getInsumoBaseCantidad(ins, rend);
    return baseCantidad * (1 + getInsumoDesperdicio(ins) / 100);
  };

  const isManualToolsInsumo = (ins: any) => {
    const unidad = (ins.unidad || '').trim().toUpperCase();
    const nombre = (ins.nombre || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
    return unidad === '%MO' || nombre.includes('HERRAMIENTAS MANUALES');
  };

  const getManoObraSubtotal = (p: any) => {
    return p.insumos.reduce((sum: number, ins: any) => {
      if (ins.tipo !== 'MO' || isManualToolsInsumo(ins)) return sum;
      return sum + getInsumoCantidad(ins, p.rendimiento) * ins.pu;
    }, 0);
  };

  const getInsumoUnitPrice = (ins: any, p?: any) => {
    if (p && isManualToolsInsumo(ins)) {
      return getManoObraSubtotal(p);
    }
    return ins.pu;
  };

  const getInsumoParcial = (ins: any, rend: number, p?: any) => {
    const unitPrice = getInsumoUnitPrice(ins, p);
    if (isManualToolsInsumo(ins)) {
      return (unitPrice * getInsumoCantidad(ins, rend)) / 100;
    }
    return getInsumoCantidad(ins, rend) * unitPrice;
  };

  const getPartidaCU = (p: any) => {
    if (p.esTitulo) return 0;
    return p.insumos.reduce((sum: number, ins: any) => sum + getInsumoParcial(ins, p.rendimiento, p), 0);
  };

  const getPartidaParcial = (p: any) => {
    if (p.esTitulo) {
      let sum = 0;
      const idx = partidas.findIndex(x => x.id === p.id);
      if (idx === -1) return 0;
      for (let i = idx + 1; i < partidas.length; i++) {
        if (partidas[i].esTitulo) break;
        sum += partidas[i].metrado * getPartidaCU(partidas[i]);
      }
      return sum;
    }
    return p.metrado * getPartidaCU(p);
  };

  const dynamicDesagregadoRows = partidas.map((p, idx) => {
    const isBold = p.esTitulo;
    const isRed = p.esTitulo && p.item.split('.').length === 1;
    const isGreen = !p.esTitulo && p.item.split('.').length >= 3;
    
    let totalCost = 0;
    const values: Record<string, string> = {};

    if (p.esTitulo) {
      // Sum all non-title partidas under this title
      const list: any[] = [];
      for (let i = idx + 1; i < partidas.length; i++) {
        if (partidas[i].esTitulo) break;
        list.push(partidas[i]);
      }
      
      const indexSums: Record<string, number> = {};
      list.forEach(subP => {
        const subPMetrado = subP.metrado;
        totalCost += subPMetrado * getPartidaCU(subP);
        subP.insumos.forEach((ins: any) => {
          const uIdx = getUnifiedIndex(ins);
          const cost = subPMetrado * getInsumoParcial(ins, subP.rendimiento, subP);
          indexSums[uIdx] = (indexSums[uIdx] || 0) + cost;
        });
      });

      desagregadoCols.forEach(col => {
        if (indexSums[col.id]) {
          values[col.id] = indexSums[col.id].toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
      });
    } else {
      totalCost = p.metrado * getPartidaCU(p);
      const indexSums: Record<string, number> = {};
      p.insumos.forEach((ins: any) => {
        const uIdx = getUnifiedIndex(ins);
        const cost = p.metrado * getInsumoParcial(ins, p.rendimiento, p);
        indexSums[uIdx] = (indexSums[uIdx] || 0) + cost;
      });

      desagregadoCols.forEach(col => {
        if (indexSums[col.id]) {
          values[col.id] = indexSums[col.id].toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
      });
    }

    return {
      item: p.item,
      desc: p.nombre,
      und: p.esTitulo ? '' : p.unidad,
      metrado: p.esTitulo ? '' : p.metrado.toLocaleString('es-PE', { minimumFractionDigits: 2 }),
      precio: p.esTitulo ? '' : getPartidaCU(p).toLocaleString('es-PE', { minimumFractionDigits: 2 }),
      total: totalCost.toLocaleString('es-PE', { minimumFractionDigits: 2 }),
      isBold,
      isRed,
      isGreen,
      values
    };
  });

  const desagregadoRows = dynamicDesagregadoRows;

  const totalPresupuestoCost = partidas
    .filter(p => !p.esTitulo)
    .reduce((sum, p) => sum + getPartidaParcial(p), 0);

  const colTotals: Record<string, number> = {};
  partidas.filter(p => !p.esTitulo).forEach(p => {
    p.insumos.forEach(ins => {
      const uIdx = getUnifiedIndex(ins);
      colTotals[uIdx] = (colTotals[uIdx] || 0) + (p.metrado * getInsumoParcial(ins, p.rendimiento, p));
    });
  });

  const getColTotalFormatted = (colId: string) => {
    if (!colTotals[colId]) return '';
    return colTotals[colId].toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getColCoefFormatted = (colId: string) => {
    if (totalPresupuestoCost === 0) return '0.000';
    return ((colTotals[colId] || 0) / totalPresupuestoCost).toFixed(3);
  };

  const handleOpenExternal = () => {
    const title = `Fórmula Polinómica - ${activeBudget?.subPresupuestos[0] || 'SUB PRESUPUESTO 1'}`;
    const newWindow = window.open('', '_blank', 'width=1200,height=850,resizable=yes');
    if (!newWindow) {
      alert('Por favor permita las ventanas emergentes (popups) para este sitio.');
      return;
    }

    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const rowsHtml = formattedRows.map((row, idx) => `
      <tr key="${row.index}">
        <td style="text-align: center; font-weight: bold; color: var(--external-text-secondary);">${idx + 1}</td>
        <td style="text-align: center; font-family: monospace; font-weight: bold;">${row.index}</td>
        <td style="font-weight: 500;">${row.name}</td>
        <td style="font-weight: bold; color: var(--external-text-secondary);">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="display:inline-flex;width:14px;height:14px;border:1px solid currentColor;border-radius:999px;"></span>
            <span>${row.symbol}</span>
          </div>
        </td>
        <td style="text-align: right; font-family: monospace; color: var(--external-text-secondary);">
          ${row.coefCalculado.toFixed(10)}
        </td>
        <td style="text-align: right; font-weight: bold;">
          <div style="display: inline-flex; align-items: center; gap: 4px;">
            <span style="width:6px;height:6px;border-radius:999px;background:#059669;display:inline-block;"></span>
            <span style="font-family: monospace;" class="coef-definido-val">
              ${row.coefDefinido.toFixed(3)}
            </span>
          </div>
        </td>
        <td style="text-align: right; font-family: monospace; color: var(--external-text-secondary);">
          ${row.pct.toFixed(2)}
        </td>
      </tr>
    `).join('');

    const desagregadoRowsHtml = desagregadoRows.map(row => {
      const isComponent = row.isRed;
      const isBold = row.isBold || isComponent;
      const colorStyle = isComponent ? 'color: #dc2626;' : (row.isGreen ? 'color: #16a34a;' : '');
      const weightStyle = isBold ? 'font-weight: bold;' : '';
      const bgStyle = isBold ? 'background: var(--external-surface);' : '';
      
      const valuesCells = desagregadoCols.map(col => {
        const val = row.values[col.id as keyof typeof row.values] || '';
        return `<td style="text-align: right; font-family: monospace; min-width: 90px; ${colorStyle} ${weightStyle}">${val}</td>`;
      }).join('');

      return `
        <tr style="${bgStyle}">
          <td style="text-align: center; font-weight: bold; color: var(--external-text-secondary); ${colorStyle}">${row.item}</td>
          <td style="${weightStyle} ${colorStyle}">${row.desc}</td>
          <td style="text-align: center; ${colorStyle}">${row.und}</td>
          <td style="text-align: right; font-family: monospace; ${colorStyle}">${row.metrado}</td>
          <td style="text-align: right; font-family: monospace; ${colorStyle}">${row.precio}</td>
          <td style="text-align: right; font-family: monospace; ${weightStyle} ${colorStyle}">${row.total}</td>
          ${valuesCells}
        </tr>
      `;
    }).join('');

    const desagregadoTotalsCells = desagregadoCols.map(col => {
      const sums = {
        '01': '1,017.00', '02': '19,171.35', '03': '211,011.17', '04': '355.93', '05': '112,388.77',
        '13': '337.40', '17': '4,909.60', '21': '168,544.57', '26': '1,433.43', '29': '4,294.00',
        '30': '21,407.05', '34': '3,498.45', '37': '22,159.41', '39': '561,056.84', '47': '856,739.00'
      };
      return `<td style="text-align: right; font-family: monospace;">${sums[col.id as keyof typeof sums]}</td>`;
    }).join('');

    const desagregadoCoefsCells = desagregadoCols.map(col => {
      const coefs = {
        '01': '0.000511', '02': '0.009644', '03': '0.106148', '04': '0.000170', '05': '0.056536',
        '13': '0.000169', '17': '0.002469', '21': '0.084785', '26': '0.000721', '29': '0.002160',
        '30': '0.010768', '34': '0.001759', '37': '0.011114', '39': '0.282238', '47': '0.431000'
      };
      return `<td style="text-align: right; font-family: monospace; color: #059669;">${coefs[col.id as keyof typeof coefs]}</td>`;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html data-theme="${currentTheme}">
        <head>
          <title>${title}</title>
          <style>
            :root,
            [data-theme="light"] {
              --external-bg: #ffffff;
              --external-surface: #f8fafc;
              --external-surface-hover: #f1f5f9;
              --external-text: #1e293b;
              --external-text-secondary: #64748b;
              --external-border: #e2e8f0;
              --external-primary: #0f52ba;
              --external-button-bg: #ffffff;
            }
            [data-theme="dark"] {
              --external-bg: #0c0e15;
              --external-surface: #121622;
              --external-surface-hover: #1b2030;
              --external-text: #f8fafc;
              --external-text-secondary: #94a3b8;
              --external-border: rgba(255, 255, 255, 0.08);
              --external-primary: #00f0ff;
              --external-button-bg: rgba(255, 255, 255, 0.03);
            }
            body {
              margin: 0;
              padding: 0;
              background-color: var(--external-bg);
              color: var(--external-text);
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              box-sizing: border-box;
            }
            [data-theme="dark"] body {
              background-color: var(--external-bg);
            }
            .modal-content-mimic {
              max-width: none;
              width: 100vw;
              min-height: 100vh;
              background: var(--external-bg);
              color: var(--external-text);
              border: none;
              border-radius: 0;
              box-shadow: none;
              overflow: hidden;
              display: flex;
              flex-direction: column;
            }
            [data-theme="dark"] .modal-content-mimic {
              background: var(--external-bg);
              color: var(--external-text);
              border: none;
              box-shadow: none;
            }
            .modal-header-mimic {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 16px 24px;
              background: var(--external-surface);
              border-bottom: 1px solid var(--external-border);
            }
            [data-theme="dark"] .modal-header-mimic {
              background: var(--external-surface);
              border-bottom: 1px solid var(--external-border);
            }
            .modal-title-mimic {
              margin: 0;
              font-size: 1.2rem;
              font-weight: 700;
              color: var(--external-text);
              display: flex;
              align-items: center;
              gap: 10px;
            }
            [data-theme="dark"] .modal-title-mimic {
              color: var(--external-text);
              text-shadow: none;
            }
            .formula-polinomica-container {
              display: flex;
              flex-direction: column;
              gap: 0px;
            }
            .formula-toolbar {
              display: flex;
              gap: 16px;
              padding: 12px 20px;
              background: var(--external-surface);
              border-bottom: 1px solid var(--external-border);
            }
            [data-theme="dark"] .formula-toolbar {
              background: var(--external-surface);
              border-bottom: 1px solid var(--external-border);
            }
            .formula-toolbar-btn {
              background: var(--external-button-bg);
              border: 1px solid var(--external-border);
              color: var(--external-text);
              font-size: 0.78rem;
              font-weight: 600;
              cursor: pointer;
              padding: 6px 14px;
              border-radius: 4px;
              display: flex;
              align-items: center;
              gap: 6px;
              transition: all 0.2s;
            }
            .line-icon {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: 16px;
              height: 16px;
              border: 1px solid currentColor;
              border-radius: 999px;
              font-size: 0.62rem;
              font-weight: 700;
              line-height: 1;
            }
            [data-theme="dark"] .formula-toolbar-btn {
              background: var(--external-button-bg);
              border: 1px solid var(--external-border);
              color: var(--external-text);
            }
            .formula-toolbar-btn:hover {
              background: var(--external-surface-hover);
              border-color: var(--external-primary);
            }
            [data-theme="dark"] .formula-toolbar-btn:hover {
              background: var(--external-surface-hover);
              border-color: var(--external-primary);
              color: var(--external-text);
            }
            .formula-tabs {
              display: flex;
              gap: 4px;
              padding: 8px 20px;
              background: var(--external-surface);
              border-bottom: 1px solid var(--external-border);
            }
            [data-theme="dark"] .formula-tabs {
              background: var(--external-surface);
              border-bottom: 1px solid var(--external-border);
            }
            .formula-tab-btn {
              background: transparent;
              border: none;
              border-bottom: 2px solid transparent;
              color: var(--external-text-secondary);
              font-size: 0.8rem;
              font-weight: 600;
              padding: 8px 16px;
              cursor: pointer;
              transition: all 0.2s ease;
            }
            .formula-tab-btn:hover {
              color: var(--external-text);
            }
            [data-theme="dark"] .formula-tab-btn:hover {
              color: var(--external-text);
            }
            .formula-tab-btn.active {
              color: var(--external-primary);
              border-bottom: 2px solid var(--external-primary);
            }
            [data-theme="dark"] .formula-tab-btn.active {
              color: var(--external-primary);
              border-bottom: 2px solid var(--external-primary);
            }
            .formula-table {
              width: 100%;
              border-collapse: collapse;
              text-align: left;
              font-size: 0.8rem;
            }
            .formula-table th {
              background: var(--external-surface);
              color: var(--external-text-secondary);
              font-weight: 600;
              text-transform: capitalize;
              font-size: 0.78rem;
              padding: 8px 12px;
              border-bottom: 1px solid var(--external-border);
              border-right: 1px solid var(--external-border);
            }
            [data-theme="dark"] .formula-table th {
              background: var(--external-surface);
              color: var(--external-text-secondary);
              border-bottom: 1px solid var(--external-border);
              border-right: 1px solid var(--external-border);
            }
            .formula-table td {
              padding: 6px 12px;
              border-bottom: 1px solid var(--external-border);
              border-right: 1px solid var(--external-border);
              color: var(--external-text);
            }
            [data-theme="dark"] .formula-table td {
              border-bottom: 1px solid var(--external-border);
              border-right: 1px solid var(--external-border);
              color: var(--external-text);
            }
            [data-theme="dark"] .coef-definido-val {
              color: var(--external-text) !important;
            }
            .formula-table tr:hover {
              background: var(--external-surface-hover);
            }
            [data-theme="dark"] .formula-table tr:hover {
              background: var(--external-surface-hover);
            }
            .alert-bar {
              background: #fffbeb;
              border: 1px solid #fef3c7;
              color: #b45309;
              padding: 10px 16px;
              font-size: 0.78rem;
              display: flex;
              align-items: center;
              gap: 8px;
              font-weight: 500;
            }
            [data-theme="dark"] .alert-bar {
              background: rgba(251, 191, 36, 0.05);
              border: 1px solid rgba(251, 191, 36, 0.15);
              color: #fbbf24;
            }
            .grid-wrapper {
              flex: 1;
              overflow: auto;
              min-height: 350px;
            }
            @media print {
              body {
                background: white;
                padding: 0;
              }
              .modal-content-mimic {
                box-shadow: none;
                border: none;
              }
              .formula-toolbar {
                display: none;
              }
              .formula-tabs {
                display: none;
              }
            }
          </style>
          <script>
            function switchTab(tabId) {
              document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
              document.querySelectorAll('.formula-tab-btn').forEach(btn => btn.classList.remove('active'));
              document.getElementById(tabId + '-content').style.display = 'block';
              document.getElementById(tabId + '-btn').classList.add('active');
            }
          </script>
        </head>
        <body>
          <div class="modal-content-mimic">
            <div class="modal-header-mimic">
              <h2 class="modal-title-mimic">
                <span class="line-icon">Σ</span>
                <span>FÓRMULA POLINÓMICA: ${activeBudget?.subPresupuestos[0] || 'SUB PRESUPUESTO 1'}</span>
              </h2>
            </div>
            
            <div class="formula-polinomica-container">
              <div class="formula-toolbar">
                <button class="formula-toolbar-btn" onclick="window.close()">
                  <span class="line-icon">←</span> Volver
                </button>
                <button class="formula-toolbar-btn" onclick="window.print()">
                  <span class="line-icon">P</span> Imprimir Detallado
                </button>
                <button class="formula-toolbar-btn" onclick="window.print()">
                  <span class="line-icon">F</span> Imprimir Fórmula
                </button>
                <button class="formula-toolbar-btn" onclick="alert('Actualizando coeficientes...')">
                  <span class="line-icon">R</span> Actualizar
                </button>
              </div>

              <div class="formula-tabs">
                <button id="formula-btn" class="formula-tab-btn active" onclick="switchTab('formula')">Coeficientes y Fórmula</button>
                <button id="desagregado-btn" class="formula-tab-btn" onclick="switchTab('desagregado')">Matriz de Desagregado (Índices Unificados)</button>
              </div>

              <div class="alert-bar">
                <span class="line-icon">!</span>
                <span>La fórmula polinómica debe tener como máximo 8 monomios</span>
              </div>

              <!-- Tab content 1 -->
              <div id="formula-content" class="tab-content" style="display: block;">
                <table class="formula-table">
                  <thead>
                    <tr>
                      <th style="width: 40px; text-align: center;">#</th>
                      <th style="width: 60px; text-align: center;">Índice</th>
                      <th>Descripción</th>
                      <th style="width: 100px;">Nomenclatura</th>
                      <th style="width: 120px; text-align: right;">Coef. Calculado</th>
                      <th style="width: 120px; text-align: right;">Coef. Definido</th>
                      <th style="width: 80px; text-align: right;">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${rowsHtml}
                    <tr style="background: var(--external-surface); font-weight: bold; border-top: 2px solid var(--external-border);">
                      <td colSpan="4" style="text-align: right; padding: 10px 12px;">Total Coeficientes:</td>
                      <td style="text-align: right; font-family: monospace; padding: 10px 12px;">1.0000000000</td>
                      <td style="text-align: right; font-family: monospace; padding: 10px 12px; color: #059669; font-size: 0.9rem;">1.000</td>
                      <td style="text-align: right; font-family: monospace; padding: 10px 12px;">100.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Tab content 2 -->
              <div id="desagregado-content" class="tab-content" style="display: none; width: 100%; overflow-x: auto;">
                <table class="formula-table">
                  <thead>
                    <tr>
                      <th style="width: 40px; text-align: center;">Item</th>
                      <th style="min-width: 250px;">Descripción</th>
                      <th style="width: 60px; text-align: center;">Und.</th>
                      <th style="width: 80px; text-align: right;">Metrado</th>
                      <th style="width: 100px; text-align: right;">Precio</th>
                      <th style="width: 120px; text-align: right;">Total</th>
                      ${desagregadoCols.map(col => `<th style="min-width: 90px; text-align: right;">${col.name}</th>`).join('')}
                    </tr>
                  </thead>
                  <tbody>
                    ${desagregadoRowsHtml}
                    <tr style="background: var(--external-surface); font-weight: bold; border-top: 2px solid var(--external-border);">
                      <td colSpan="5" style="text-align: right; padding: 10px 12px;">Total:</td>
                      <td style="text-align: right; font-family: monospace; padding: 10px 12px; color: #dc2626;">1,987,882.30</td>
                      ${desagregadoTotalsCells}
                    </tr>
                    <tr style="background: var(--external-surface-hover); font-weight: bold;">
                      <td colSpan="5" style="text-align: right; padding: 10px 12px; color: #059669;">Total Coeficiente:</td>
                      <td style="text-align: right; font-family: monospace; padding: 10px 12px; color: #059669;">1.000</td>
                      ${desagregadoCoefsCells}
                    </tr>
                  </tbody>
                </table>
              </div>

            </div>
          </div>
        </body>
      </html>
    `;

    newWindow.document.write(htmlContent);
    newWindow.document.close();
    onClose();
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`Fórmula Polinómica: ${activeBudget?.subPresupuestos[0] || 'Sub Presupuesto 1'}`}
      onExternalOpen={handleOpenExternal}
    >
      <style>{`
        .modal-overlay:has(.formula-polinomica-container) {
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          background: var(--modal-overlay-bg) !important;
        }
        .modal-overlay:has(.formula-polinomica-container) .modal-header {
          display: flex !important;
          justify-content: space-between !important;
          align-items: center !important;
          padding: 16px 24px !important;
          background: var(--modal-header-bg) !important;
          border-bottom: 1px solid var(--border-color) !important;
        }
        [data-theme="dark"] .modal-overlay:has(.formula-polinomica-container) .modal-header {
          background: var(--modal-header-bg) !important;
          border-bottom: 1px solid var(--border-color) !important;
        }
        .modal-overlay:has(.formula-polinomica-container) .modal-title {
          font-size: 1.2rem !important;
          font-weight: 700 !important;
          color: var(--text-primary) !important;
          display: flex !important;
          align-items: center !important;
          gap: 10px !important;
        }
        [data-theme="dark"] .modal-overlay:has(.formula-polinomica-container) .modal-title {
          color: var(--text-primary) !important;
          text-shadow: none !important;
        }
        .modal-overlay:has(.formula-polinomica-container) .modal-close {
          border: none !important;
          border-radius: 50% !important;
          width: 24px !important;
          height: 24px !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          cursor: pointer !important;
          transition: all 0.2s ease !important;
          font-size: 0.85rem !important;
          line-height: 1 !important;
          background: var(--modal-close-bg) !important;
          color: var(--text-secondary) !important;
        }
        .modal-overlay:has(.formula-polinomica-container) .modal-close:hover {
          background: var(--modal-close-hover-bg) !important;
          color: var(--text-primary) !important;
          transform: translateY(-1px) !important;
        }
        .modal-overlay:has(.formula-polinomica-container) .modal-close:nth-child(2):hover {
          background: #fee2e2 !important;
          color: #ef4444 !important;
        }
        [data-theme="dark"] .modal-overlay:has(.formula-polinomica-container) .modal-close {
          background: var(--modal-close-bg) !important;
          color: var(--text-secondary) !important;
        }
        [data-theme="dark"] .modal-overlay:has(.formula-polinomica-container) .modal-close:hover {
          background: var(--modal-close-hover-bg) !important;
          color: var(--text-primary) !important;
          box-shadow: var(--border-glow) !important;
        }
        [data-theme="dark"] .modal-overlay:has(.formula-polinomica-container) .modal-close:nth-child(2):hover {
          background: rgba(239, 68, 68, 0.2) !important;
          color: #f87171 !important;
          box-shadow: 0 0 8px rgba(239, 68, 68, 0.4) !important;
        }
        .modal-overlay:has(.formula-polinomica-container) .modal-content {
          max-width: 1300px !important;
          width: 95% !important;
          height: 750px !important;
          min-width: 800px !important;
          min-height: 500px !important;
          padding: 0 !important;
          overflow: auto !important;
          resize: both !important;
          background: var(--modal-bg) !important;
          color: var(--text-primary) !important;
          border: 1px solid var(--border-color) !important;
          box-shadow: var(--modal-shadow) !important;
        }
        [data-theme="dark"] .modal-overlay:has(.formula-polinomica-container) .modal-content {
          background: var(--modal-bg) !important;
          color: var(--text-primary) !important;
          border: 1px solid var(--border-color) !important;
          box-shadow: var(--modal-shadow) !important;
        }
        .formula-polinomica-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          gap: 0px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .formula-toolbar {
          display: flex;
          gap: 16px;
          padding: 12px 20px;
          background: var(--modal-panel-bg);
          border-bottom: 1px solid var(--border-color);
        }
        [data-theme="dark"] .formula-toolbar {
          background: var(--modal-panel-bg);
          border-bottom: 1px solid var(--border-color);
        }
        .formula-toolbar-btn {
          background: var(--modal-bg);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          padding: 6px 14px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }
        [data-theme="dark"] .formula-toolbar-btn {
          background: var(--modal-panel-bg);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
        }
        .formula-toolbar-btn:hover {
          background: var(--modal-panel-hover-bg);
          border-color: var(--border-color-focus);
        }
        [data-theme="dark"] .formula-toolbar-btn:hover {
          background: var(--modal-panel-hover-bg);
          border-color: var(--border-color-focus);
          color: var(--text-primary);
        }
        .formula-tabs {
          display: flex;
          gap: 4px;
          padding: 8px 20px;
          background: var(--modal-panel-bg);
          border-bottom: 1px solid var(--border-color);
        }
        [data-theme="dark"] .formula-tabs {
          background: var(--modal-panel-bg);
          border-bottom: 1px solid var(--border-color);
        }
        .formula-tab-btn {
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          color: var(--text-secondary);
          font-size: 0.8rem;
          font-weight: 600;
          padding: 8px 16px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .formula-tab-btn:hover {
          color: var(--text-primary);
        }
        [data-theme="dark"] .formula-tab-btn:hover {
          color: var(--text-primary);
        }
        .formula-tab-btn.active {
          color: var(--color-primary);
          border-bottom: 2px solid var(--color-primary);
        }
        [data-theme="dark"] .formula-tab-btn.active {
          color: var(--color-primary);
          border-bottom: 2px solid var(--color-primary);
        }
        .formula-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 0.8rem;
        }
        .formula-table th {
          background: var(--modal-panel-bg);
          color: var(--text-secondary);
          font-weight: 600;
          text-transform: capitalize;
          font-size: 0.78rem;
          padding: 8px 12px;
          border-bottom: 1px solid var(--border-color);
          border-right: 1px solid var(--border-color);
        }
        [data-theme="dark"] .formula-table th {
          background: var(--modal-panel-bg);
          color: var(--text-secondary);
          border-bottom: 1px solid var(--border-color);
          border-right: 1px solid var(--border-color);
        }
        .formula-table td {
          padding: 6px 12px;
          border-bottom: 1px solid var(--modal-divider-color);
          border-right: 1px solid var(--modal-divider-color);
          color: var(--text-primary);
        }
        [data-theme="dark"] .formula-table td {
          border-bottom: 1px solid var(--modal-divider-color);
          border-right: 1px solid var(--modal-divider-color);
          color: var(--text-primary);
        }
        .formula-table tr:hover {
          background: var(--modal-panel-hover-bg);
        }
        [data-theme="dark"] .formula-table tr:hover {
          background: var(--modal-panel-hover-bg);
        }
        .alert-bar {
          background: #fffbeb;
          border: 1px solid #fef3c7;
          color: #b45309;
          padding: 10px 16px;
          font-size: 0.78rem;
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
        }
        [data-theme="dark"] .alert-bar {
          background: rgba(251, 191, 36, 0.05);
          border: 1px solid rgba(251, 191, 36, 0.15);
          color: #fbbf24;
        }
      `}</style>

      <div className="formula-polinomica-container">
        {/* Toolbar */}
        <div className="formula-toolbar">
          <button className="formula-toolbar-btn" onClick={onClose}>
            <LiteIcon name="arrow-left" size={16} /> Volver
          </button>
          <button className="formula-toolbar-btn" onClick={handleOpenExternal}>
            <LiteIcon name="file-text" size={16} /> Imprimir Detallado
          </button>
          <button className="formula-toolbar-btn" onClick={handleOpenExternal}>
            <LiteIcon name="chart" size={16} /> Imprimir Fórmula
          </button>
          <button className="formula-toolbar-btn" onClick={() => alert('Actualizando coeficientes...')}>
            <LiteIcon name="redo" size={16} /> Actualizar
          </button>
        </div>

        {/* Tab selection */}
        <div className="formula-tabs">
          <button className={`formula-tab-btn ${activeTab === 'formula' ? 'active' : ''}`} onClick={() => setActiveTab('formula')}>Coeficientes y Fórmula</button>
          <button className={`formula-tab-btn ${activeTab === 'desagregado' ? 'active' : ''}`} onClick={() => setActiveTab('desagregado')}>Matriz de Desagregado (Índices Unificados)</button>
        </div>

        {/* Warning banner */}
        <div className="alert-bar">
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, border: '1px solid currentColor', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 800 }}>!</span>
          <span>La fórmula polinómica debe tener como máximo 8 monomios</span>
        </div>

        {activeTab === 'formula' ? (
          <div style={{ flex: 1, overflowY: 'auto', minHeight: '300px' }}>
            <table className="formula-table">
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>#</th>
                  <th style={{ width: '60px', textAlign: 'center' }}>Índice</th>
                  <th>Descripción</th>
                  <th style={{ width: '100px' }}>Nomenclatura</th>
                  <th style={{ width: '120px', textAlign: 'right' }}>Coef. Calculado</th>
                  <th style={{ width: '120px', textAlign: 'right' }}>Coef. Definido</th>
                  <th style={{ width: '80px', textAlign: 'right' }}>%</th>
                </tr>
              </thead>
              <tbody>
                {formattedRows.map((row, idx) => (
                  <tr key={row.index}>
                    <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--text-secondary)' }}>{idx + 1}</td>
                    <td style={{ textAlign: 'center', fontFamily: 'monospace', fontWeight: 'bold' }}>{row.index}</td>
                    <td style={{ fontWeight: 500 }}>{row.name}</td>
                    <td style={{ fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ display: 'inline-flex', width: 14, height: 14, border: '1px solid currentColor', borderRadius: 999 }} />
                        <span>{row.symbol}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                      {row.coefCalculado.toFixed(10)}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: 6, height: 6, borderRadius: 999, background: '#059669', display: 'inline-block' }} />
                        <span style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                          {row.coefDefinido.toFixed(3)}
                        </span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                      {row.pct.toFixed(2)}
                    </td>
                  </tr>
                ))}
                <tr style={{ background: 'var(--modal-panel-bg)', fontWeight: 'bold', borderTop: '2px solid var(--border-color)' }}>
                  <td colSpan={4} style={{ textAlign: 'right', padding: '10px 12px' }}>Total Coeficientes:</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace', padding: '10px 12px' }}>1.0000000000</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace', padding: '10px 12px', color: '#059669', fontSize: '0.9rem' }}>1.000</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace', padding: '10px 12px' }}>100.00</td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ flex: 1, overflow: 'auto', minHeight: '300px' }}>
            <table className="formula-table" style={{ width: 'max-content', minWidth: '100%' }}>
              <thead>
                <tr>
                  <th style={{ width: '60px', textAlign: 'center' }}>Item</th>
                  <th style={{ minWidth: '350px' }}>Descripción</th>
                  <th style={{ width: '60px', textAlign: 'center' }}>Und.</th>
                  <th style={{ width: '100px', textAlign: 'right' }}>Metrado</th>
                  <th style={{ width: '100px', textAlign: 'right' }}>Precio</th>
                  <th style={{ width: '120px', textAlign: 'right' }}>Total</th>
                  {desagregadoCols.map(col => (
                    <th key={col.id} style={{ minWidth: '110px', textAlign: 'right' }}>{col.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {desagregadoRows.map(row => {
                  const isComponent = row.isRed;
                  const isBold = row.isBold || isComponent;
                  const fontColor = isComponent ? '#dc2626' : (row.isGreen ? '#16a34a' : 'inherit');
                  return (
                    <tr key={row.item} style={{ background: isBold ? 'var(--modal-panel-bg)' : 'transparent', fontWeight: isBold ? 'bold' : 'normal' }}>
                      <td style={{ textAlign: 'center', color: fontColor }}>{row.item}</td>
                      <td style={{ color: fontColor }}>{row.desc}</td>
                      <td style={{ textAlign: 'center', color: fontColor }}>{row.und}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', color: fontColor }}>{row.metrado}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', color: fontColor }}>{row.precio}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', color: fontColor }}>{row.total}</td>
                      {desagregadoCols.map(col => (
                        <td key={col.id} style={{ textAlign: 'right', fontFamily: 'monospace', color: fontColor }}>
                          {row.values[col.id as keyof typeof row.values] || ''}
                        </td>
                      ))}
                    </tr>
                  );
                })}
                <tr style={{ background: 'var(--modal-panel-bg)', fontWeight: 'bold', borderTop: '2px solid var(--border-color)' }}>
                  <td colSpan={5} style={{ textAlign: 'right', padding: '10px 12px' }}>Total:</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace', padding: '10px 12px', color: '#dc2626' }}>
                    {totalPresupuestoCost.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  {desagregadoCols.map(col => (
                    <td key={col.id} style={{ textAlign: 'right', fontFamily: 'monospace', padding: '10px 12px' }}>
                      {getColTotalFormatted(col.id)}
                    </td>
                  ))}
                </tr>
                <tr style={{ background: 'var(--modal-panel-hover-bg)', fontWeight: 'bold' }}>
                  <td colSpan={5} style={{ textAlign: 'right', padding: '10px 12px', color: '#059669' }}>Total Coeficiente:</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace', padding: '10px 12px', color: '#059669' }}>1.000</td>
                  {desagregadoCols.map(col => (
                    <td key={col.id} style={{ textAlign: 'right', fontFamily: 'monospace', padding: '10px 12px', color: '#059669' }}>
                      {getColCoefFormatted(col.id)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Close Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 20px', background: 'var(--modal-panel-bg)', borderTop: '1px solid var(--border-color)' }}>
          <button
            onClick={onClose}
            style={{
              background: 'var(--modal-bg)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              padding: '6px 20px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.78rem',
              transition: 'all 0.2s ease'
            }}
          >
            Aceptar
          </button>
        </div>
      </div>
    </Modal>
  );
};

// Catalogue modals
export const CatalogoInsumosModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  catalogoInsumos: any[];
  ciSearchTerm: string;
  setCiSearchTerm: (v: string) => void;
  ciSelectedTipo: string;
  setCiSelectedTipo: (v: string) => void;
  onAddFromCatalog: (ins: any) => void;
}> = ({ isOpen, onClose, catalogoInsumos, ciSearchTerm, setCiSearchTerm, ciSelectedTipo, setCiSelectedTipo, onAddFromCatalog }) => {
  const filtered = catalogoInsumos.filter(item => {
    const matchesSearch = item.nombre.toLowerCase().includes(ciSearchTerm.toLowerCase());
    const matchesTipo = ciSelectedTipo === 'TODOS' || item.tipo === ciSelectedTipo;
    return matchesSearch && matchesTipo;
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Catálogo de Insumos">
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            placeholder="Buscar en catálogo..."
            value={ciSearchTerm}
            onChange={(e) => setCiSearchTerm(e.target.value)}
            style={{ ...dgInputStyle, flexGrow: 1 }}
          />
          <select
            value={ciSelectedTipo}
            onChange={(e) => setCiSelectedTipo(e.target.value)}
            style={{ ...dgInputStyle, width: '180px' }}
          >
            <option value="TODOS">Todos los tipos</option>
            <option value="MATERIAL">Materiales</option>
            <option value="MANO DE OBRA">Mano de Obra</option>
            <option value="EQUIPO">Equipos</option>
            <option value="SUB CONTRATO">Subcontratos</option>
          </select>
        </div>
        <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-surface-elevated)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '8px 12px' }}>Descripción</th>
                <th style={{ padding: '8px 12px', width: '10%' }}>Unidad</th>
                <th style={{ padding: '8px 12px', width: '20%' }}>Tipo</th>
                <th style={{ padding: '8px 12px', width: '15%', textAlign: 'right' }}>Precio (S/)</th>
                <th style={{ padding: '8px 12px', width: '10%', textAlign: 'center' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '8px 12px' }}>{item.nombre}</td>
                  <td style={{ padding: '8px 12px' }}>{item.unidad}</td>
                  <td style={{ padding: '8px 12px' }}>{item.tipo}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right' }}>{item.precio.toFixed(2)}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                    <Button onClick={() => onAddFromCatalog(item)} style={{ padding: '4px 8px', fontSize: '0.75rem' }}>Agregar</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={onClose}>Cerrar</Button>
        </div>
      </div>
    </Modal>
  );
};

export const CatalogoPartidasModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  catalogoPartidas: any[];
  cpSearchTerm: string;
  setCpSearchTerm: (v: string) => void;
  cpSelectedPartidaIndex: number;
  setCpSelectedPartidaIndex: (v: number) => void;
  onAddPartidaFromCatalog: (partida: any) => void;
}> = ({ isOpen, onClose, catalogoPartidas, cpSearchTerm, setCpSearchTerm, cpSelectedPartidaIndex, setCpSelectedPartidaIndex, onAddPartidaFromCatalog }) => {
  const filtered = catalogoPartidas.filter(p => p.nombre.toLowerCase().includes(cpSearchTerm.toLowerCase()));
  const activePartida = filtered[cpSelectedPartidaIndex] || null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Catálogo de Partidas">
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <input
          type="text"
          placeholder="Buscar partida..."
          value={cpSearchTerm}
          onChange={(e) => setCpSearchTerm(e.target.value)}
          style={dgInputStyle}
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ border: '1px solid var(--border-color)', borderRadius: '4px', maxHeight: '300px', overflowY: 'auto' }}>
            {filtered.map((p, idx) => (
              <div
                key={idx}
                onClick={() => setCpSelectedPartidaIndex(idx)}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--border-color)',
                  background: cpSelectedPartidaIndex === idx ? 'rgba(0, 240, 255, 0.05)' : 'transparent',
                  color: cpSelectedPartidaIndex === idx ? '#00f0ff' : 'var(--text-primary)',
                  fontSize: '0.8rem'
                }}
              >
                {p.nombre}
              </div>
            ))}
          </div>
          <div style={{ border: '1px solid var(--border-color)', borderRadius: '4px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {activePartida ? (
              <>
                <h4 style={{ color: 'var(--color-primary)', margin: 0, fontSize: '0.9rem' }}>{activePartida.nombre}</h4>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Unidad: {activePartida.unidad} | Rendimiento: {activePartida.rendimiento}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>Análisis de Precios:</div>
                <div style={{ flexGrow: 1, overflowY: 'auto', maxHeight: '180px' }}>
                  {activePartida.insumos.map((ins: any, idx: number) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', padding: '4px 0', borderBottom: '1px dashed rgba(255,255,255,0.05)' }}>
                      <span>{ins.nombre}</span>
                      <span>S/ {ins.parcial?.toFixed(2) || (ins.pu * ins.cuadrilla).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <Button onClick={() => onAddPartidaFromCatalog(activePartida)} style={{ background: 'var(--color-primary)', border: 'none', color: 'var(--text-on-primary)', fontWeight: 'bold' }}>Agregar al presupuesto</Button>
              </>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '30px' }}>Seleccione una partida del catálogo.</div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={onClose}>Cerrar</Button>
        </div>
      </div>
    </Modal>
  );
};

export const ImportarPartidaModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  budgets: Budget[];
  activeBudgetId: string;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  selectedScope: 'global' | 'local';
  setSelectedScope: (v: 'global' | 'local') => void;
  onImportPartida: (sourceBudgetId: string, sourcePartidaId: string, scope: 'global' | 'local') => void;
}> = ({ isOpen, onClose, budgets, activeBudgetId, searchTerm, setSearchTerm, selectedScope, setSelectedScope, onImportPartida }) => {
  const sourceBudgets = budgets.filter(b => b.id !== activeBudgetId);
  const filteredBudgets = sourceBudgets.filter(b => {
    const budgetMatch = b.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const partidaMatch = b.partidas.some(p => p.nombre.toLowerCase().includes(searchTerm.toLowerCase()));
    return budgetMatch || partidaMatch;
  });

  const [selectedBudgetId, setSelectedBudgetId] = useState<string>(filteredBudgets[0]?.id || '');
  const [selectedPartidaId, setSelectedPartidaId] = useState<string>('');

  useEffect(() => {
    if (!filteredBudgets.length) {
      setSelectedBudgetId('');
      setSelectedPartidaId('');
      return;
    }
    if (!selectedBudgetId || !filteredBudgets.some(b => b.id === selectedBudgetId)) {
      setSelectedBudgetId(filteredBudgets[0].id);
    }
  }, [filteredBudgets, selectedBudgetId]);

  useEffect(() => {
    const budget = filteredBudgets.find(b => b.id === selectedBudgetId);
    const firstPartida = budget?.partidas.find(p => !p.esTitulo)?.id || budget?.partidas[0]?.id || '';
    setSelectedPartidaId(prev => prev && budget?.partidas.some(p => p.id === prev) ? prev : firstPartida);
  }, [selectedBudgetId, filteredBudgets]);

  const selectedBudget = filteredBudgets.find(b => b.id === selectedBudgetId) || null;
  const selectedPartida = selectedBudget?.partidas.find(p => p.id === selectedPartidaId) || null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Búsqueda de Partidas">
      <div className="import-partida-container" style={{ padding: '24px 28px 28px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <style>{`
          .modal-overlay:has(.import-partida-container) .modal-content {
            width: min(940px, calc(100vw - 48px));
            max-width: min(940px, calc(100vw - 48px));
            max-height: calc(100vh - 56px);
            padding: 0;
            overflow: hidden;
            border-radius: 18px;
            box-shadow: var(--shadow-lg), 0 24px 80px rgba(15, 23, 42, 0.24);
          }

          .modal-overlay:has(.import-partida-container) .modal-header {
            margin: 0;
            padding: 28px 32px 18px;
            border-bottom: 1px solid var(--border-color);
            background: var(--modal-header-bg);
          }

          .modal-overlay:has(.import-partida-container) .modal-title {
            font-size: 1.38rem;
            letter-spacing: 0;
          }

          .modal-overlay:has(.import-partida-container) .modal-body {
            max-height: calc(100vh - 142px);
            overflow: auto;
          }

          @media (max-width: 860px) {
            .modal-overlay:has(.import-partida-container) .modal-content {
              width: calc(100vw - 24px);
              max-width: calc(100vw - 24px);
              max-height: calc(100vh - 24px);
            }

            .modal-overlay:has(.import-partida-container) .modal-header {
              padding: 22px 20px 16px;
            }

            .import-partida-container {
              padding: 18px 20px 22px !important;
            }

            .import-partida-grid,
            .import-partida-meta-grid,
            .import-partida-scope-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
        <div style={{ padding: '14px 16px', border: '1px solid rgba(14, 165, 233, 0.28)', borderRadius: '10px', background: 'rgba(14, 165, 233, 0.08)', color: 'var(--text-primary)', fontSize: '0.84rem', lineHeight: 1.45 }}>
          <strong>Advertencia:</strong> al importar una partida, también se importan sus insumos. Los insumos son globales por regla de oro en todos los proyectos. Puedes decidir si ese precio se aplica globalmente o solo en este proyecto.
        </div>
        <input
          type="text"
          placeholder="Buscar por nombre de presupuesto o partida..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ ...dgInputStyle, padding: '13px 15px', borderRadius: '8px', fontSize: '0.9rem', background: 'var(--modal-input-bg)' }}
        />

        <div className="import-partida-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 0.95fr) minmax(420px, 1.25fr)', gap: '18px', minHeight: '430px' }}>
          <div style={{ border: '1px solid var(--border-color)', borderRadius: '10px', maxHeight: '430px', overflowY: 'auto', background: 'var(--modal-panel-bg)' }}>
            {filteredBudgets.length === 0 ? (
              <div style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>No hay presupuestos adicionales para importar.</div>
            ) : (
              filteredBudgets.map(b => (
                <div
                  key={b.id}
                  onClick={() => setSelectedBudgetId(b.id)}
                  style={{
                    padding: '14px 16px',
                    borderBottom: '1px solid var(--border-color)',
                    borderLeft: selectedBudgetId === b.id ? '3px solid var(--color-primary)' : '3px solid transparent',
                    cursor: 'pointer',
                    background: selectedBudgetId === b.id ? 'var(--color-primary-glow)' : 'transparent',
                    transition: 'background 0.16s ease, border-color 0.16s ease'
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: '0.88rem', lineHeight: 1.3 }}>{b.nombre}</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '5px' }}>{b.partidas.filter(p => !p.esTitulo).length} partidas APU · {b.partidas.length} items</div>
                </div>
              ))
            )}
          </div>

          <div style={{ border: '1px solid var(--border-color)', borderRadius: '10px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--modal-panel-bg)' }}>
            {selectedBudget ? (
              <>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-primary)', lineHeight: 1.35 }}>{selectedBudget.nombre}</div>
                <select
                  value={selectedPartidaId}
                  onChange={(e) => setSelectedPartidaId(e.target.value)}
                  style={{ ...dgInputStyle, padding: '12px 14px', borderRadius: '8px', fontSize: '0.88rem', background: 'var(--modal-input-bg)' }}
                >
                  {selectedBudget.partidas.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>

                {selectedPartida ? (
                  <>
                    <div className="import-partida-meta-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '10px' }}>
                      <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px', background: 'var(--modal-bg)' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '5px' }}>Unidad</div>
                        <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>{selectedPartida.unidad || '-'}</strong>
                      </div>
                      <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px', background: 'var(--modal-bg)' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '5px' }}>Rendimiento</div>
                        <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>{selectedPartida.rendimiento || 1}</strong>
                      </div>
                      <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px', background: 'var(--modal-bg)' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '5px' }}>Insumos</div>
                        <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>{selectedPartida.insumos.length}</strong>
                      </div>
                    </div>
                    <div className="import-partida-scope-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedScope('global')}
                        style={{
                          padding: '13px 14px',
                          minHeight: '78px',
                          borderRadius: '10px',
                          border: selectedScope === 'global' ? '1px solid rgba(0, 240, 255, 0.55)' : '1px solid var(--border-color)',
                          background: selectedScope === 'global' ? 'var(--color-primary-glow)' : 'var(--modal-bg)',
                          color: 'var(--text-primary)',
                          cursor: 'pointer',
                          fontWeight: 800,
                          textAlign: 'left',
                          lineHeight: 1.35,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px'
                        }}
                      >
                        <LiteIcon name="database" size={17} />
                        Global (cambia en todos los proyectos)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedScope('local')}
                        style={{
                          padding: '13px 14px',
                          minHeight: '78px',
                          borderRadius: '10px',
                          border: selectedScope === 'local' ? '1px solid rgba(244, 63, 94, 0.55)' : '1px solid var(--border-color)',
                          background: selectedScope === 'local' ? 'var(--color-danger-glow)' : 'var(--modal-bg)',
                          color: 'var(--text-primary)',
                          cursor: 'pointer',
                          fontWeight: 800,
                          textAlign: 'left',
                          lineHeight: 1.35,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px'
                        }}
                      >
                        <LiteIcon name="file-text" size={17} />
                        Solo este proyecto
                      </button>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'rgba(0, 240, 255, 0.055)', borderLeft: '3px solid rgba(0, 240, 255, 0.45)', borderRadius: '6px', padding: '10px 12px', lineHeight: 1.45 }}>
                      {selectedScope === 'global'
                        ? 'Cuando edites el APU de cualquier insumo importado en este presupuesto, ese cambio se reflejará en los demás proyectos que compartan el mismo insumo.'
                        : 'Cuando edites el APU de esta partida acá, el cambio quedará solo en este proyecto y no se propagará a los demás.'}
                    </div>
                    <Button onClick={() => onImportPartida(selectedBudget.id, selectedPartida.id, selectedScope)} style={{ background: 'var(--color-primary)', border: 'none', color: 'var(--text-on-primary)', fontWeight: 'bold', padding: '12px 16px', borderRadius: '8px' }}>
                      Importar partida
                    </Button>
                  </>
                ) : (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Seleccione una partida.</div>
                )}
              </>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '30px' }}>No se encontró una partida.</div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={onClose}>Cerrar</Button>
        </div>
      </div>
    </Modal>
  );
};

export const ListaInsumosModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  activeBudget: Budget | null;
}> = ({ isOpen, onClose, activeBudget }) => {
  const getBaseCantidad = (ins: any, rend: number) => {
    const explicitCantidad = typeof ins.cantidad === 'number' && Number.isFinite(ins.cantidad) ? ins.cantidad : null;
    if (ins.unidad === '%MO') return explicitCantidad ?? ins.cuadrilla;
    if (ins.tipo === 'MO') return rend > 0 ? (ins.cuadrilla * 8) / rend : 0;
    if (ins.tipo === 'EQ') return explicitCantidad ?? (rend > 0 ? (ins.cuadrilla * 8) / rend : 0);
    return explicitCantidad ?? ins.cuadrilla;
  };

  const getDesperdicio = (ins: any) => {
    const raw = typeof ins.desperdicio === 'number' && Number.isFinite(ins.desperdicio) ? ins.desperdicio : 0;
    return ins.tipo === 'MT' ? Math.max(0, raw) : 0;
  };

  const getCantidad = (ins: any, rend: number) => {
    const baseCantidad = getBaseCantidad(ins, rend);
    return baseCantidad * (1 + getDesperdicio(ins) / 100);
  };

  const isManualTools = (ins: any) => {
    const unidad = (ins.unidad || '').trim().toUpperCase();
    const nombre = (ins.nombre || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
    return unidad === '%MO' || nombre.includes('HERRAMIENTAS MANUALES');
  };

  const getMoSubtotal = (p: any) => p.insumos.reduce((sum: number, ins: any) => {
    if (ins.tipo !== 'MO' || isManualTools(ins)) return sum;
    return sum + getCantidad(ins, p.rendimiento) * ins.pu;
  }, 0);

  const getParcial = (ins: any, p: any) => {
    const unitPrice = isManualTools(ins) ? getMoSubtotal(p) : ins.pu;
    return isManualTools(ins)
      ? (unitPrice * getCantidad(ins, p.rendimiento)) / 100
      : getCantidad(ins, p.rendimiento) * unitPrice;
  };

  const insumoRows = activeBudget?.partidas
    .filter(p => !p.esTitulo)
    .flatMap(p => p.insumos.map(ins => ({ ...ins, totalParcial: p.metrado * getParcial(ins, p) })))
    .reduce((acc: any[], current) => {
      const key = `${current.codigo || ''}|${current.nombre}|${current.unidad}|${current.tipo}`;
      const existing = acc.find(x => x.key === key);
      if (existing) {
        existing.totalParcial += current.totalParcial;
      } else {
        acc.push({ ...current, key });
      }
      return acc;
    }, []) || [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Lista de Insumos: ${activeBudget?.subPresupuestos[0] || 'Sub Presupuesto 1'}`}>
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-surface-elevated)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '8px 12px', width: '12%', fontFamily: 'monospace' }}>Código</th>
                <th style={{ padding: '8px 12px' }}>Insumo</th>
                <th style={{ padding: '8px 12px', width: '10%' }}>Unidad</th>
                <th style={{ padding: '8px 12px', width: '20%' }}>Tipo</th>
                <th style={{ padding: '8px 12px', width: '15%', textAlign: 'right' }}>Total Parcial</th>
              </tr>
            </thead>
            <tbody>
              {insumoRows.map((ins, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: '0.76rem', color: 'var(--text-muted)' }}>{ins.codigo || '—'}</td>
                  <td style={{ padding: '8px 12px' }}>{ins.nombre}</td>
                  <td style={{ padding: '8px 12px' }}>{ins.unidad}</td>
                  <td style={{ padding: '8px 12px' }}>{ins.tipo}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right' }}>S/ {ins.totalParcial.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={onClose}>Cerrar</Button>
        </div>
      </div>
    </Modal>
  );
};

export const ConfiguracionModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  showGridlines: boolean;
  setShowGridlines: (v: boolean) => void;
}> = ({ isOpen, onClose, showGridlines, setShowGridlines }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configuración de Usuario">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)' }}>Mostrar cuadrículas por defecto</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Muestra las líneas divisorias en la tabla de presupuestos y en la tabla de APU.</div>
          </div>
          <label className="switch-container" style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
            <input
              type="checkbox"
              checked={showGridlines}
              onChange={(e) => setShowGridlines(e.target.checked)}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span className="switch-slider" style={{
              position: 'absolute',
              cursor: 'pointer',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: showGridlines ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)',
              transition: '0.3s',
              borderRadius: '24px',
              border: '1px solid var(--border-color)'
            }}>
              <span style={{
                position: 'absolute',
                height: '16px',
                width: '16px',
                left: showGridlines ? '22px' : '4px',
                bottom: '3px',
                backgroundColor: '#ffffff',
                transition: '0.3s',
                borderRadius: '50%',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }} />
            </span>
          </label>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
          <Button onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
};
export const AgregarConIAModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  budgets: Budget[];
  catalogoInsumos: any[];
  activeBudgetId: string;
  onAddPartida: (partidaToImport: Partida) => void;
}> = ({ isOpen, onClose, budgets, catalogoInsumos, activeBudgetId, onAddPartida }) => {
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<'PARTIDA' | 'TITULO'>('PARTIDA');
  const [descripcion, setDescripcion] = useState('');
  const [lugar, setLugar] = useState('');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<{ source: 'DB' | 'IA', data: Partida }[]>([]);

  const handleGenerate = () => {
    setIsGenerating(true);
    setResults([]);
    
    // Simulate API delay
    setTimeout(() => {
      const generatedResults: { source: 'DB' | 'IA', data: Partida }[] = [];
      
      // 1. Mock DB search
      const dbMatches: Partida[] = [];
      budgets.forEach(b => {
        b.partidas.forEach(p => {
          if (p.esTitulo === (tipo === 'TITULO') && p.nombre.toLowerCase().includes(nombre.toLowerCase())) {
            dbMatches.push(p);
          }
        });
      });
      
      const uniqueDbMatches = dbMatches.filter((v,i,a)=>a.findIndex(v2=>(v2.nombre===v.nombre))===i).slice(0, 2);
      uniqueDbMatches.forEach(p => generatedResults.push({ source: 'DB', data: p }));

      // Helper function to match and merge generated insumos with the catalog
      const mergeWithCatalog = (insumos: Insumo[]): Insumo[] => {
        return insumos.map(ins => {
          if (!catalogoInsumos) return ins;
          const normalize = (s: string) => s.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          
          const match = catalogoInsumos.find(c => 
            normalize(c.nombre) === normalize(ins.nombre) || 
            (c.codigo && c.codigo === ins.codigo)
          );
          
          if (match) {
            return {
              ...ins,
              id: match.id || ins.id,
              codigo: match.codigo || ins.codigo,
              pu: match.precio !== undefined ? match.precio : ins.pu,
              unidad: match.unidad || ins.unidad,
              tipo: match.tipo || ins.tipo
            };
          }
          return ins;
        });
      };

      // 2. Mock AI generations
      const aiMock1: Partida = {
        id: 'ai_' + Math.random().toString(36).substring(2, 9),
        item: '',
        nombre: nombre ? `${nombre} (Generado por IA)` : 'NUEVA PARTIDA (IA)',
        esTitulo: tipo === 'TITULO',
        unidad: tipo === 'TITULO' ? '' : 'M2',
        metrado: 1,
        rendimiento: tipo === 'TITULO' ? 1 : (Math.floor(Math.random() * 50) + 10),
        insumos: mergeWithCatalog(tipo === 'TITULO' ? [] : [
          { id: 'i1', nombre: 'OPERARIO', tipo: 'MO', unidad: 'hh', cuadrilla: 1, pu: 20 },
          { id: 'i2', nombre: 'PEON', tipo: 'MO', unidad: 'hh', cuadrilla: 2, pu: 15 },
          { id: 'i3', nombre: 'MATERIAL BASE', tipo: 'MT', unidad: 'kg', cuadrilla: 0, cantidad: 5, pu: 10 },
          { id: 'i4', nombre: 'HERRAMIENTAS MANUALES', tipo: 'EQ', unidad: '%mo', cuadrilla: 0, pu: 0.05 }
        ])
      };

      const aiMock2: Partida = {
        id: 'ai_' + Math.random().toString(36).substring(2, 9),
        item: '',
        nombre: nombre ? `${nombre} ${lugar ? `en ${lugar}` : 'Premium'}`.toUpperCase() : 'PARTIDA PREMIUM (IA)',
        esTitulo: tipo === 'TITULO',
        unidad: tipo === 'TITULO' ? '' : 'GLB',
        metrado: 1,
        rendimiento: 1,
        insumos: mergeWithCatalog(tipo === 'TITULO' ? [] : [
          { id: 'i1', nombre: 'ESPECIALISTA', tipo: 'MO', unidad: 'hh', cuadrilla: 1, pu: 30 },
          { id: 'i2', nombre: 'EQUIPO ESPECIAL', tipo: 'EQ', unidad: 'hm', cuadrilla: 1, pu: 50 }
        ])
      };

      generatedResults.push({ source: 'IA', data: aiMock1 });
      generatedResults.push({ source: 'IA', data: aiMock2 });

      setResults(generatedResults);
      setIsGenerating(false);
    }, 1500);
  };

  const handleAdd = (result: { source: 'DB' | 'IA', data: Partida }) => {
    onAddPartida({ 
      ...result.data, 
      id: 'p_' + Math.random().toString(36).substring(2, 9), 
      isImported: true,
      importedFrom: result.source === 'IA' ? 'Generador IA' : 'Catálogo Local',
      importedAt: Date.now()
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Agregar Partida/Título con IA">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px 0', width: '700px', maxWidth: '90vw' }}>
        
        {/* Form */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Tipo</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as 'PARTIDA' | 'TITULO')}
              style={dgInputStyle}
            >
              <option value="PARTIDA">Partida</option>
              <option value="TITULO">Título</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Nombre de la {tipo === 'TITULO' ? 'Título' : 'Partida'}</label>
            <Input 
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder={`Ej: ${tipo === 'TITULO' ? 'Obras Provisionales' : 'Excavación de zanjas'}`}
              style={dgInputStyle}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 8, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Descripción Adicional (Opcional)</label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Describe más detalles sobre el elemento a generar..."
            style={{ ...dgInputStyle, minHeight: '60px', resize: 'vertical' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 8, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Configuración Avanzada (Opcional)</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Input 
              value={lugar}
              onChange={(e) => setLugar(e.target.value)}
              placeholder="Lugar / Región"
              style={dgInputStyle}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button 
            onClick={handleGenerate}
            disabled={!nombre || isGenerating}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--color-primary-glow)', color: 'var(--color-primary)', border: '1px solid rgba(15, 82, 186, 0.25)' }}
          >
            <LiteIcon name={isGenerating ? "refresh-cw" : "sparkles"} size={16} />
            {isGenerating ? 'Generando...' : (results.length > 0 ? 'Volver a Iterar' : 'Generar Resultados')}
          </Button>
        </div>

        {/* Results Area */}
        {results.length > 0 && (
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto' }}>
            <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Resultados Obtenidos</h4>
            
            {results.map((res, index) => (
              <div key={index} style={{ 
                display: 'flex', flexDirection: 'column',
                padding: '12px 16px', borderRadius: '8px',
                background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ 
                        fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold',
                        background: res.source === 'IA' ? 'rgba(168, 85, 247, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                        color: res.source === 'IA' ? '#a855f7' : '#22c55e'
                      }}>
                        {res.source === 'IA' ? 'Generado por IA' : 'Base de Datos'}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {res.data.esTitulo ? 'TÍTULO' : 'PARTIDA'}
                      </span>
                    </div>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{res.data.nombre}</strong>
                    {!res.data.esTitulo && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Unidad: {res.data.unidad} | Rendimiento: {res.data.rendimiento}
                      </span>
                    )}
                  </div>
                  <Button 
                    onClick={() => handleAdd(res)}
                    style={{ background: 'var(--grad-primary)', border: 'none', color: '#fff', fontSize: '0.8rem', padding: '6px 12px', height: 'fit-content' }}
                  >
                    Agregar
                  </Button>
                </div>
                
                {/* APU Breakdown */}
                {!res.data.esTitulo && res.data.insumos && res.data.insumos.length > 0 && (
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed var(--border-color)', fontSize: '0.75rem' }}>
                    <div style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>Análisis de Precios Unitarios (APU)</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ color: 'var(--text-muted)' }}>
                          <th style={{ paddingBottom: '4px' }}>Descripción</th>
                          <th style={{ paddingBottom: '4px' }}>Tipo</th>
                          <th style={{ paddingBottom: '4px' }}>Und.</th>
                          <th style={{ paddingBottom: '4px' }}>Cuadrilla</th>
                          <th style={{ paddingBottom: '4px' }}>Precio</th>
                        </tr>
                      </thead>
                      <tbody>
                        {res.data.insumos.map((ins, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <td style={{ padding: '4px 0', color: 'var(--text-primary)' }}>
                              {ins.codigo && <span style={{ color: 'var(--text-muted)', marginRight: '6px' }}>[{ins.codigo}]</span>}
                              {ins.nombre}
                            </td>
                            <td style={{ padding: '4px 0', color: 'var(--text-secondary)' }}>{ins.tipo}</td>
                            <td style={{ padding: '4px 0', color: 'var(--text-secondary)' }}>{ins.unidad}</td>
                            <td style={{ padding: '4px 0', color: 'var(--text-primary)' }}>{ins.cuadrilla || ins.cantidad || '-'}</td>
                            <td style={{ padding: '4px 0', color: 'var(--text-primary)' }}>{ins.pu.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </Modal>
  );
};
