import React, { useState, useEffect } from 'react';
import { Modal, Input, Select, Button } from '@infrasuite/shared';
import type { Budget, Partida, Insumo, PartidaColumnKey } from './types';

// Common CSS styles
export const thStyle: React.CSSProperties = {
  padding: '12px 16px',
  fontSize: '0.76rem',
  textTransform: 'uppercase',
  borderBottom: '1px solid var(--border-color)'
};

export const tdStyle: React.CSSProperties = {
  padding: '12px 16px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.02)',
  color: 'var(--text-secondary)'
};

export const tableInputStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.02)',
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
  background: 'rgba(255, 255, 255, 0.02)',
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
                background: 'var(--bg-surface-elevated, #181d28)',
                border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
                borderRadius: '6px',
                maxHeight: '200px',
                overflowY: 'auto',
                zIndex: 1000,
                boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
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
                    borderBottom: '1px solid rgba(255,255,255,0.02)',
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
                  </div>
                  <span style={{
                    fontSize: '0.72rem',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'rgba(255,255,255,0.05)',
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
          />
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
            label="Precio Unitario (PU) *"
            value={insumoPU}
            onChange={(e) => setInsumoPU(e.target.value)}
            required
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
      title="EDITAR DATOS GENERALES"
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
                  color: '#121622',
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid var(--border-color)', padding: '12px', borderRadius: '6px', background: 'rgba(0,0,0,0.1)' }}>
              {dgSubPresupuestos.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '12px' }}>No hay sub presupuestos agregados.</div>
              ) : (
                dgSubPresupuestos.map((sub, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
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
            color: '#121622',
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
      title="GASTOS GENERALES"
    >
      <style>{`
        .modal-overlay:has(.gg-container) .modal-content {
          max-width: 800px !important;
          width: 95% !important;
          padding: 0 !important;
          overflow: hidden !important;
          background: #0f111a !important;
          border: 1px solid rgba(0, 240, 255, 0.2) !important;
          box-shadow: 0 0 30px rgba(0, 240, 255, 0.1) !important;
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
          background: rgba(255, 255, 255, 0.01);
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
            background: 'rgba(255,255,255,0.01)',
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
            background: 'rgba(0, 0, 0, 0.1)'
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
                            fontSize: '1rem',
                            transition: 'transform 0.1s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
                          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                          🗑️
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
            background: 'rgba(0,0,0,0.15)',
            borderRadius: '8px',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Formato:</span>
              <select
                style={{
                  background: 'rgba(0, 0, 0, 0.25)',
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
              ➕ Agregar item
            </button>
          </div>

          {/* Close Button Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.03)',
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
  pieRows: any[];
  setPieRows: (v: any[]) => void;
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

  const handleUpdateRow = (index: number, field: string, val: any) => {
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
      resaltar: false
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
      title={`PIE DEL SUB PRESUPUESTO: ${activeBudget?.subPresupuestos[0] || 'SUB PRESUPUESTO 1'}`}
    >
      <style>{`
        .modal-overlay:has(.pie-presupuesto-container) .modal-content {
          max-width: 900px !important;
          width: 95% !important;
          padding: 0 !important;
          overflow: hidden !important;
          background: #0f111a !important;
          border: 1px solid rgba(0, 240, 255, 0.2) !important;
          box-shadow: 0 0 30px rgba(0, 240, 255, 0.1) !important;
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
          background: rgba(255, 255, 255, 0.02);
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
          background: rgba(255, 255, 255, 0.03);
          color: var(--text-secondary);
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.76rem;
          padding: 10px 12px;
          border-bottom: 1px solid var(--border-color);
          border-right: 1px solid rgba(255, 255, 255, 0.05);
        }
        .pie-presupuesto-table td {
          padding: 4px 8px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          border-right: 1px solid rgba(255, 255, 255, 0.03);
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
          border-color: rgba(255, 255, 255, 0.15);
          background: rgba(255, 255, 255, 0.01);
          border-radius: 4px;
        }
        .pie-presupuesto-table input:disabled {
          color: var(--text-muted) !important;
          cursor: not-allowed;
        }
        .pie-agregar-row {
          display: flex;
          justifyContent: center;
          align-items: center;
          padding: 10px;
          background: rgba(255, 255, 255, 0.01);
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
                <th style={{ width: '12%', textAlign: 'center' }}>Variable</th>
                <th style={{ width: '35%' }}>Descripción</th>
                <th style={{ width: '20%' }}>Fórmula</th>
                <th style={{ width: '15%', textAlign: 'right' }}>Valor</th>
                <th style={{ width: '8%', textAlign: 'center' }}>IU</th>
                <th style={{ width: '8%', textAlign: 'center' }}>Resaltar?</th>
                <th style={{ width: '5%', textAlign: 'center' }}></th>
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
                            fontSize: '1rem'
                          }}
                        >
                          🗑️
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
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 20px', background: 'rgba(0,0,0,0.1)' }}>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.03)',
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
  const sumCoef = formulaPolinomicaRows.reduce((sum, r) => sum + (r.coeficiente || 0), 0);
  const isCorrectSum = Math.abs(sumCoef - 1.000) < 0.001;

  const handleUpdateRow = (index: number, field: string, val: any) => {
    const copy = [...formulaPolinomicaRows];
    copy[index] = { ...copy[index], [field]: val };
    setFormulaPolinomicaRows(copy);
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`FÓRMULA POLINÓMICA: ${activeBudget?.subPresupuestos[0] || 'SUB PRESUPUESTO 1'}`}
    >
      <style>{`
        .modal-overlay:has(.formula-polinomica-container) .modal-content {
          max-width: 900px !important;
          width: 95% !important;
          padding: 0 !important;
          overflow: hidden !important;
          background: #0f111a !important;
          border: 1px solid rgba(0, 240, 255, 0.2) !important;
          box-shadow: 0 0 30px rgba(0, 240, 255, 0.1) !important;
        }
        .formula-polinomica-container {
          display: flex;
          flex-direction: column;
          gap: 0px;
        }
        .formula-toolbar {
          display: flex;
          gap: 20px;
          padding: 12px 20px;
          background: rgba(255, 255, 255, 0.02);
          border-bottom: 1px solid var(--border-color);
        }
        .formula-toolbar-btn {
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
        .formula-toolbar-btn:hover {
          color: var(--color-primary);
          text-shadow: 0 0 8px rgba(0, 240, 255, 0.5);
        }
        .formula-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 0.85rem;
        }
        .formula-table th {
          background: rgba(255, 255, 255, 0.03);
          color: var(--text-secondary);
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.76rem;
          padding: 10px 12px;
          border-bottom: 1px solid var(--border-color);
          border-right: 1px solid rgba(255, 255, 255, 0.05);
        }
        .formula-table td {
          padding: 4px 8px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          border-right: 1px solid rgba(255, 255, 255, 0.03);
          color: var(--text-secondary);
        }
        .formula-table input[type="text"], .formula-table input[type="number"] {
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
        .formula-table input:focus {
          border-color: rgba(0, 240, 255, 0.4);
          background: rgba(0, 240, 255, 0.03);
          border-radius: 4px;
        }
        .formula-table input:hover:not(:focus):not(:disabled) {
          border-color: rgba(255, 255, 255, 0.15);
          background: rgba(255, 255, 255, 0.01);
          border-radius: 4px;
        }
        .formula-table select {
          background: transparent;
          border: 1px solid transparent;
          color: var(--text-primary);
          outline: none;
          padding: 6px 10px;
          font-size: 0.85rem;
          width: 100%;
          cursor: pointer;
          transition: all 0.15s;
          box-sizing: border-box;
        }
        .formula-table select:focus {
          border-color: rgba(0, 240, 255, 0.4);
          background: rgba(15, 17, 26, 0.95);
          border-radius: 4px;
        }
        .formula-table select:hover:not(:focus) {
          border-color: rgba(255, 255, 255, 0.15);
          background: rgba(255, 255, 255, 0.01);
          border-radius: 4px;
        }
        .formula-table select option {
          background: #0f111a;
          color: var(--text-primary);
        }
      `}</style>

      <div className="formula-polinomica-container">
        {/* Toolbar */}
        <div className="formula-toolbar">
          <button 
            className="formula-toolbar-btn"
            onClick={() => {
              if (!isCorrectSum) {
                alert(`La suma de coeficientes es ${sumCoef.toFixed(3)}. Debe ser exactamente 1.000 antes de aplicar.`);
              } else {
                alert('Fórmula polinómica aplicada con éxito.');
                onClose();
              }
            }}
          >
            Aplicar
          </button>
          <button 
            className="formula-toolbar-btn"
            onClick={() => {
              alert('Recalculando coeficientes en base al presupuesto...');
            }}
          >
            Recalcular
          </button>
          <button 
            className="formula-toolbar-btn"
            onClick={() => alert('Generando PDF de la fórmula polinómica...')}
          >
            PDF
          </button>
          <button 
            className="formula-toolbar-btn"
            onClick={() => alert('Exportando fórmula a hoja de cálculo...')}
          >
            Exportar a hoja de cálculo
          </button>
        </div>

        {/* Table */}
        <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
          <table className="formula-table">
            <thead>
              <tr>
                <th style={{ width: '45%' }}>IU</th>
                <th style={{ width: '15%', textAlign: 'right' }}>Coeficiente</th>
                <th style={{ width: '15%', textAlign: 'center' }}>Monomio</th>
                <th style={{ width: '12%', textAlign: 'left' }}>Factor</th>
                <th style={{ width: '13%', textAlign: 'left' }}>Símbolo</th>
              </tr>
            </thead>
            <tbody>
              {formulaPolinomicaRows.map((row, idx) => (
                <tr key={idx}>
                  {/* IU */}
                  <td style={{ color: 'var(--text-primary)', fontWeight: 500, paddingLeft: '12px' }}>
                    {row.iu}
                  </td>

                  {/* Coeficiente */}
                  <td>
                    <input
                      type="number"
                      step="0.001"
                      value={row.coeficiente}
                      onChange={(e) => handleUpdateRow(idx, 'coeficiente', parseFloat(e.target.value) || 0)}
                      style={{
                        textAlign: 'right',
                        fontFamily: 'monospace',
                        fontWeight: 'bold',
                        color: 'var(--color-primary)'
                      }}
                    />
                  </td>

                  {/* Monomio */}
                  <td style={{ textAlign: 'center' }}>
                    <select
                      value={row.monomio}
                      onChange={(e) => handleUpdateRow(idx, 'monomio', parseInt(e.target.value) || 1)}
                      style={{
                        textAlign: 'center',
                        fontWeight: 500
                      }}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </td>

                  {/* Factor */}
                  <td>
                    <input
                      type="text"
                      placeholder=""
                      value={row.factor}
                      onChange={(e) => handleUpdateRow(idx, 'factor', e.target.value)}
                    />
                  </td>

                  {/* Símbolo */}
                  <td>
                    <input
                      type="text"
                      placeholder=""
                      value={row.simbolo}
                      onChange={(e) => handleUpdateRow(idx, 'simbolo', e.target.value)}
                      style={{
                        fontWeight: 'bold',
                        color: 'var(--color-secondary)'
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Status bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 20px',
          background: 'rgba(255, 255, 255, 0.01)',
          borderTop: '1px solid var(--border-color)',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            * Los coeficientes deben sumar exactamente 1.000
          </span>
          <div style={{
            background: isCorrectSum ? 'rgba(16, 185, 129, 0.08)' : 'rgba(244, 63, 94, 0.08)',
            border: isCorrectSum ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(244, 63, 94, 0.3)',
            color: isCorrectSum ? 'var(--color-success)' : 'var(--color-danger)',
            padding: '6px 14px',
            borderRadius: '6px',
            fontSize: '0.82rem',
            fontWeight: 'bold'
          }}>
            Suma de Coeficientes = {sumCoef.toFixed(3)}
          </div>
        </div>

        {/* Close Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 20px', background: 'rgba(0,0,0,0.1)' }}>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.03)',
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
    <Modal isOpen={isOpen} onClose={onClose} title="CATÁLOGO DE INSUMOS">
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
    <Modal isOpen={isOpen} onClose={onClose} title="CATÁLOGO DE PARTIDAS">
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
                <Button onClick={() => onAddPartidaFromCatalog(activePartida)} style={{ background: 'var(--color-primary)', border: 'none', color: '#121622', fontWeight: 'bold' }}>Agregar al presupuesto</Button>
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

export const ListaInsumosModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  activeBudget: Budget | null;
}> = ({ isOpen, onClose, activeBudget }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`LISTA DE INSUMOS: ${activeBudget?.subPresupuestos[0] || 'SUB PRESUPUESTO 1'}`}>
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-surface-elevated)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '8px 12px' }}>Insumo</th>
                <th style={{ padding: '8px 12px', width: '10%' }}>Unidad</th>
                <th style={{ padding: '8px 12px', width: '20%' }}>Tipo</th>
                <th style={{ padding: '8px 12px', width: '15%', textAlign: 'right' }}>Total Parcial</th>
              </tr>
            </thead>
            <tbody>
              {activeBudget?.partidas.flatMap(p => p.insumos).reduce((acc: any[], current) => {
                const existing = acc.find(x => x.nombre === current.nombre);
                if (existing) {
                  existing.pu += current.pu; // Simple aggregate
                } else {
                  acc.push({ ...current });
                }
                return acc;
              }, []).map((ins, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '8px 12px' }}>{ins.nombre}</td>
                  <td style={{ padding: '8px 12px' }}>{ins.unidad}</td>
                  <td style={{ padding: '8px 12px' }}>{ins.tipo}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right' }}>S/ {(ins.pu * (ins.cuadrilla || 1)).toFixed(2)}</td>
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
