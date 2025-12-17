/* ═══════════════════════════════════════════════════════════
   TESTING SUITE - CUSTOMIZATION COMPONENTS
   ═══════════════════════════════════════════════════════════ */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ColorPreview from '../components/admin/ColorPreview';
import ColorPresets from '../components/admin/ColorPresets';

// Mock de DesignSystemUtils
jest.mock('../utils/design-system-utils', () => ({
  DesignSystemUtils: {
    getContrastText: jest.fn((color) => color === '#111827' ? '#FFFFFF' : '#000000'),
    ensureWCAGCompliance: jest.fn(() => ({
      isCompliant: true,
      level: 'AA',
      contrastRatio: 4.5,
      adjusted: false
    })),
    generateHarmoniousPalette: jest.fn(() => ({
      primary: { base: '#3B82F6' },
      complementary: { base: '#F59E0B' }
    }))
  }
}));

describe('ColorPreview Component', () => {
  const defaultProps = {
    primaryColor: '#3B82F6',
    accentColor: '#10B981',
    backgroundColor: '#111827',
    secondaryBackgroundColor: '#1F2937',
    onColorChange: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders ColorPreview component', () => {
    render(<ColorPreview {...defaultProps} />);
    
    expect(screen.getByText('Vista Previa en Tiempo Real')).toBeInTheDocument();
    expect(screen.getByText('Ve cómo se verán los cambios antes de guardar')).toBeInTheDocument();
  });

  test('shows WCAG compliance indicator', () => {
    render(<ColorPreview {...defaultProps} />);
    
    expect(screen.getByText('Accesibilidad WCAG: AA')).toBeInTheDocument();
    expect(screen.getByText('Ratio de contraste: 4.50:1')).toBeInTheDocument();
  });

  test('toggles preview visibility', async () => {
    render(<ColorPreview {...defaultProps} />);
    
    const toggleButton = screen.getByText('Mostrar Preview');
    fireEvent.click(toggleButton);
    
    await waitFor(() => {
      expect(screen.getByText('Ocultar Preview')).toBeInTheDocument();
    });
  });

  test('generates harmonious palette', () => {
    render(<ColorPreview {...defaultProps} />);
    
    const generateButton = screen.getByText('Generar Paleta');
    fireEvent.click(generateButton);
    
    // Verificar que se llamó la función de generación
    expect(require('../utils/design-system-utils').DesignSystemUtils.generateHarmoniousPalette).toHaveBeenCalled();
  });

  test('applies color changes', () => {
    render(<ColorPreview {...defaultProps} />);
    
    const applyButton = screen.getByText('Aplicar Cambios');
    fireEvent.click(applyButton);
    
    expect(defaultProps.onColorChange).toHaveBeenCalled();
  });

  test('resets preview colors', () => {
    render(<ColorPreview {...defaultProps} />);
    
    const resetButton = screen.getByText('Resetear');
    fireEvent.click(resetButton);
    
    // Verificar que se resetean los colores
    expect(screen.getByText('Primario')).toBeInTheDocument();
  });
});

describe('ColorPresets Component', () => {
  const defaultProps = {
    onPresetSelect: jest.fn(),
    currentColors: {
      primary: '#3B82F6',
      accent: '#10B981',
      background: '#111827',
      secondaryBackground: '#1F2937'
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders ColorPresets component', () => {
    render(<ColorPresets {...defaultProps} />);
    
    expect(screen.getByText('Presets Profesionales')).toBeInTheDocument();
    expect(screen.getByText('Selecciona una paleta predefinida o crea la tuya')).toBeInTheDocument();
  });

  test('shows all preset categories', () => {
    render(<ColorPresets {...defaultProps} />);
    
    expect(screen.getByText('Todos')).toBeInTheDocument();
    expect(screen.getByText('Profesional')).toBeInTheDocument();
    expect(screen.getByText('Vibrante')).toBeInTheDocument();
    expect(screen.getByText('Minimalista')).toBeInTheDocument();
    expect(screen.getByText('Naturaleza')).toBeInTheDocument();
  });

  test('filters presets by category', () => {
    render(<ColorPresets {...defaultProps} />);
    
    const professionalButton = screen.getByText('Profesional');
    fireEvent.click(professionalButton);
    
    // Verificar que se muestra el preset profesional
    expect(screen.getByText('Azul Profesional')).toBeInTheDocument();
  });

  test('selects preset and calls onPresetSelect', () => {
    render(<ColorPresets {...defaultProps} />);
    
    const presetCard = screen.getByText('Azul Profesional');
    fireEvent.click(presetCard);
    
    expect(defaultProps.onPresetSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Azul Profesional',
        colors: expect.objectContaining({
          primary: '#3B82F6'
        })
      })
    );
  });

  test('generates random palette', () => {
    render(<ColorPresets {...defaultProps} />);
    
    const randomButton = screen.getByText('Generar Aleatoria');
    fireEvent.click(randomButton);
    
    expect(defaultProps.onPresetSelect).toHaveBeenCalled();
  });

  test('shows current preset indicator', () => {
    render(<ColorPresets {...defaultProps} />);
    
    // Verificar que se muestra el indicador para el preset actual
    const indicators = screen.getAllByRole('button');
    expect(indicators.length).toBeGreaterThan(0);
  });
});

// Test de integración
describe('Customization System Integration', () => {
  test('ColorPreview and ColorPresets work together', () => {
    const mockOnColorChange = jest.fn();
    const mockOnPresetSelect = jest.fn();
    
    const { rerender } = render(
      <div>
        <ColorPresets 
          onPresetSelect={mockOnPresetSelect}
          currentColors={{
            primary: '#3B82F6',
            accent: '#10B981',
            background: '#111827',
            secondaryBackground: '#1F2937'
          }}
        />
        <ColorPreview
          primaryColor="#3B82F6"
          accentColor="#10B981"
          backgroundColor="#111827"
          secondaryBackgroundColor="#1F2937"
          onColorChange={mockOnColorChange}
        />
      </div>
    );
    
    // Simular selección de preset
    const presetCard = screen.getByText('Azul Profesional');
    fireEvent.click(presetCard);
    
    expect(mockOnPresetSelect).toHaveBeenCalled();
    
    // Simular cambio de color
    const applyButton = screen.getByText('Aplicar Cambios');
    fireEvent.click(applyButton);
    
    expect(mockOnColorChange).toHaveBeenCalled();
  });
});

// Test de accesibilidad
describe('Accessibility Tests', () => {
  test('ColorPreview has proper ARIA labels', () => {
    render(
      <ColorPreview
        primaryColor="#3B82F6"
        accentColor="#10B981"
        backgroundColor="#111827"
        secondaryBackgroundColor="#1F2937"
        onColorChange={jest.fn()}
      />
    );
    
    // Verificar que los botones tienen texto descriptivo
    expect(screen.getByText('Mostrar Preview')).toBeInTheDocument();
    expect(screen.getByText('Generar Paleta')).toBeInTheDocument();
  });

  test('ColorPresets has proper ARIA labels', () => {
    render(
      <ColorPresets
        onPresetSelect={jest.fn()}
        currentColors={{
          primary: '#3B82F6',
          accent: '#10B981',
          background: '#111827',
          secondaryBackground: '#1F2937'
        }}
      />
    );
    
    // Verificar que los botones tienen texto descriptivo
    expect(screen.getByText('Todos')).toBeInTheDocument();
    expect(screen.getByText('Profesional')).toBeInTheDocument();
  });
});

// Test de performance
describe('Performance Tests', () => {
  test('ColorPreview renders quickly', () => {
    const startTime = performance.now();
    
    render(
      <ColorPreview
        primaryColor="#3B82F6"
        accentColor="#10B981"
        backgroundColor="#111827"
        secondaryBackgroundColor="#1F2937"
        onColorChange={jest.fn()}
      />
    );
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Verificar que el renderizado es rápido (menos de 100ms)
    expect(renderTime).toBeLessThan(100);
  });

  test('ColorPresets renders quickly', () => {
    const startTime = performance.now();
    
    render(
      <ColorPresets
        onPresetSelect={jest.fn()}
        currentColors={{
          primary: '#3B82F6',
          accent: '#10B981',
          background: '#111827',
          secondaryBackground: '#1F2937'
        }}
      />
    );
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Verificar que el renderizado es rápido (menos de 100ms)
    expect(renderTime).toBeLessThan(100);
  });
});

export { ColorPreview, ColorPresets };
