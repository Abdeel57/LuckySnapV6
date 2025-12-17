import React, { useState } from 'react';
import { Palette, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface ColorPreset {
  name: string;
  description: string;
  colors: {
    primary: string;
    accent: string;
    background: string;
    secondaryBackground: string;
  };
  category: 'professional' | 'vibrant' | 'minimal' | 'nature';
}

const colorPresets: ColorPreset[] = [
  {
    name: 'Azul Profesional',
    description: 'Perfecto para empresas serias y confiables',
    colors: {
      primary: '#3B82F6',
      accent: '#10B981',
      background: '#111827',
      secondaryBackground: '#1F2937'
    },
    category: 'professional'
  },
  {
    name: 'Púrpura Creativo',
    description: 'Ideal para marcas creativas y artísticas',
    colors: {
      primary: '#8B5CF6',
      accent: '#F59E0B',
      background: '#111827',
      secondaryBackground: '#1F2937'
    },
    category: 'vibrant'
  },
  {
    name: 'Verde Naturaleza',
    description: 'Fresco y natural, perfecto para productos orgánicos',
    colors: {
      primary: '#10B981',
      accent: '#F59E0B',
      background: '#111827',
      secondaryBackground: '#1F2937'
    },
    category: 'nature'
  },
  {
    name: 'Rojo Energético',
    description: 'Dinámico y llamativo para marcas deportivas',
    colors: {
      primary: '#EF4444',
      accent: '#F59E0B',
      background: '#111827',
      secondaryBackground: '#1F2937'
    },
    category: 'vibrant'
  },
  {
    name: 'Minimalista Gris',
    description: 'Elegante y sofisticado para marcas premium',
    colors: {
      primary: '#6B7280',
      accent: '#9CA3AF',
      background: '#111827',
      secondaryBackground: '#1F2937'
    },
    category: 'minimal'
  },
  {
    name: 'Naranja Vibrante',
    description: 'Optimista y energético para marcas juveniles',
    colors: {
      primary: '#F97316',
      accent: '#EAB308',
      background: '#111827',
      secondaryBackground: '#1F2937'
    },
    category: 'vibrant'
  }
];

interface ColorPresetsProps {
  onPresetSelect: (preset: ColorPreset) => void;
  currentColors: {
    primary: string;
    accent: string;
    background: string;
    secondaryBackground: string;
  };
}

const ColorPresets: React.FC<ColorPresetsProps> = ({ onPresetSelect, currentColors }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', name: 'Todos', icon: '🎨' },
    { id: 'professional', name: 'Profesional', icon: '💼' },
    { id: 'vibrant', name: 'Vibrante', icon: '🌈' },
    { id: 'minimal', name: 'Minimalista', icon: '⚪' },
    { id: 'nature', name: 'Naturaleza', icon: '🌿' }
  ];

  const filteredPresets = selectedCategory === 'all' 
    ? colorPresets 
    : colorPresets.filter(preset => preset.category === selectedCategory);

  const isCurrentPreset = (preset: ColorPreset) => {
    return preset.colors.primary === currentColors.primary && 
           preset.colors.accent === currentColors.accent;
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-indigo-100 rounded-xl">
          <Sparkles className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Presets Profesionales</h3>
          <p className="text-sm text-gray-600">Selecciona una paleta predefinida o crea la tuya</p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              selectedCategory === category.id
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="mr-2">{category.icon}</span>
            {category.name}
          </button>
        ))}
      </div>

      {/* Presets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPresets.map((preset, index) => (
          <motion.div
            key={preset.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onPresetSelect(preset)}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
              isCurrentPreset(preset)
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900">{preset.name}</h4>
              {isCurrentPreset(preset) && (
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              )}
            </div>
            
            <p className="text-sm text-gray-600 mb-4">{preset.description}</p>
            
            {/* Color Preview */}
            <div className="flex space-x-2">
              <div 
                className="w-8 h-8 rounded-lg border shadow-sm"
                style={{ backgroundColor: preset.colors.primary }}
                title="Color primario"
              ></div>
              <div 
                className="w-8 h-8 rounded-lg border shadow-sm"
                style={{ backgroundColor: preset.colors.accent }}
                title="Color de acento"
              ></div>
              <div 
                className="w-8 h-8 rounded-lg border shadow-sm"
                style={{ backgroundColor: preset.colors.background }}
                title="Color de fondo"
              ></div>
              <div 
                className="w-8 h-8 rounded-lg border shadow-sm"
                style={{ backgroundColor: preset.colors.secondaryBackground }}
                title="Color secundario"
              ></div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Custom Palette Generator */}
      <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200">
        <div className="flex items-center space-x-3 mb-3">
          <Palette className="w-5 h-5 text-purple-600" />
          <h4 className="font-semibold text-gray-900">Generador Inteligente</h4>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Nuestro sistema genera automáticamente paletas armónicas basadas en teoría del color
        </p>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              // Generar paleta aleatoria
              const randomHue = Math.floor(Math.random() * 360);
              const randomPreset: ColorPreset = {
                name: 'Paleta Generada',
                description: 'Generada automáticamente',
                colors: {
                  primary: `hsl(${randomHue}, 70%, 50%)`,
                  accent: `hsl(${(randomHue + 60) % 360}, 70%, 50%)`,
                  background: '#111827',
                  secondaryBackground: '#1F2937'
                },
                category: 'professional'
              };
              onPresetSelect(randomPreset);
            }}
            className="btn-primary text-sm px-4 py-2"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Generar Aleatoria
          </button>
        </div>
      </div>
    </div>
  );
};

export default ColorPresets;
