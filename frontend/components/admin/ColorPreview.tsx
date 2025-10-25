import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, ExternalLink, CheckCircle, AlertTriangle } from 'lucide-react';
import { DesignSystemUtils } from '../../utils/design-system-utils';

interface ColorPreviewProps {
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  secondaryBackgroundColor: string;
  onColorChange?: (colors: {
    primary: string;
    accent: string;
    background: string;
    secondaryBackground: string;
  }) => void;
}

const ColorPreview: React.FC<ColorPreviewProps> = ({
  primaryColor,
  accentColor,
  backgroundColor,
  secondaryBackgroundColor,
  onColorChange
}) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewColors, setPreviewColors] = useState({
    primary: primaryColor,
    accent: accentColor,
    background: backgroundColor,
    secondaryBackground: secondaryBackgroundColor
  });
  const [wcagCompliance, setWcagCompliance] = useState<any>(null);

  useEffect(() => {
    setPreviewColors({
      primary: primaryColor,
      accent: accentColor,
      background: backgroundColor,
      secondaryBackground: secondaryBackgroundColor
    });
  }, [primaryColor, accentColor, backgroundColor, secondaryBackgroundColor]);

  useEffect(() => {
    // Validar WCAG compliance
    const textColor = DesignSystemUtils.getContrastText(backgroundColor);
    const compliance = DesignSystemUtils.ensureWCAGCompliance(textColor, backgroundColor);
    setWcagCompliance(compliance);
  }, [backgroundColor]);

  const applyPreview = () => {
    if (onColorChange) {
      onColorChange(previewColors);
    }
  };

  const resetPreview = () => {
    setPreviewColors({
      primary: primaryColor,
      accent: accentColor,
      background: backgroundColor,
      secondaryBackground: secondaryBackgroundColor
    });
  };

  const generateHarmoniousPalette = () => {
    const palette = DesignSystemUtils.generateHarmoniousPalette(previewColors.primary);
    setPreviewColors({
      primary: palette.primary.base,
      accent: palette.complementary.base,
      background: backgroundColor,
      secondaryBackground: secondaryBackgroundColor
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 rounded-xl">
            <Eye className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Vista Previa en Tiempo Real</h3>
            <p className="text-sm text-gray-600">Ve cómo se verán los cambios antes de guardar</p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setIsPreviewOpen(!isPreviewOpen)}
            className="btn-secondary text-sm px-4 py-2"
          >
            {isPreviewOpen ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {isPreviewOpen ? 'Ocultar' : 'Mostrar'} Preview
          </button>
          
          <button
            onClick={generateHarmoniousPalette}
            className="btn-primary text-sm px-4 py-2"
          >
            <Palette className="w-4 h-4 mr-2" />
            Generar Paleta
          </button>
        </div>
      </div>

      {/* WCAG Compliance Indicator */}
      {wcagCompliance && (
        <div className="mb-6 p-4 rounded-xl border">
          <div className="flex items-center space-x-3">
            {wcagCompliance.isCompliant ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
            )}
            <div>
              <p className="font-semibold text-gray-900">
                Accesibilidad WCAG: {wcagCompliance.level}
              </p>
              <p className="text-sm text-gray-600">
                Ratio de contraste: {wcagCompliance.contrastRatio.toFixed(2)}:1
                {wcagCompliance.adjusted && ' (ajustado automáticamente)'}
              </p>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {isPreviewOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="border rounded-xl overflow-hidden">
              <iframe
                src="/"
                className="w-full h-96 border-0"
                style={{
                  filter: 'none',
                  transform: 'scale(0.5)',
                  transformOrigin: 'top left',
                  width: '200%',
                  height: '200%'
                }}
                title="Preview de la página pública"
              />
            </div>
            
            <div className="mt-4 flex justify-between">
              <button
                onClick={resetPreview}
                className="btn-secondary text-sm px-4 py-2"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Resetear
              </button>
              
              <button
                onClick={applyPreview}
                className="btn-primary text-sm px-4 py-2"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Aplicar Cambios
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Color Palette Preview */}
      <div className="mt-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Paleta de Colores Generada</h4>
        <div className="grid grid-cols-4 gap-3">
          <div className="text-center">
            <div 
              className="w-full h-16 rounded-lg border shadow-sm"
              style={{ backgroundColor: previewColors.primary }}
            ></div>
            <p className="text-xs text-gray-600 mt-1">Primario</p>
          </div>
          <div className="text-center">
            <div 
              className="w-full h-16 rounded-lg border shadow-sm"
              style={{ backgroundColor: previewColors.accent }}
            ></div>
            <p className="text-xs text-gray-600 mt-1">Acento</p>
          </div>
          <div className="text-center">
            <div 
              className="w-full h-16 rounded-lg border shadow-sm"
              style={{ backgroundColor: previewColors.background }}
            ></div>
            <p className="text-xs text-gray-600 mt-1">Fondo</p>
          </div>
          <div className="text-center">
            <div 
              className="w-full h-16 rounded-lg border shadow-sm"
              style={{ backgroundColor: previewColors.secondaryBackground }}
            ></div>
            <p className="text-xs text-gray-600 mt-1">Secundario</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorPreview;
