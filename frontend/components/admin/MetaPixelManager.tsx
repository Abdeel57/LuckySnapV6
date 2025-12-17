import React, { useState, useEffect } from 'react';

interface CustomAudience {
  id: string;
  name: string;
  description: string;
  criteria: {
    type: 'purchasers' | 'high_value' | 'inactive' | 'cart_abandoners' | 'frequent_buyers';
    conditions: any;
  };
  size: number;
  lastUpdated: string;
  metaAudienceId?: string;
}

interface CampaignMetrics {
  campaignId: string;
  name: string;
  status: 'active' | 'paused' | 'completed';
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  costPerClick: number;
  costPerConversion: number;
  returnOnAdSpend: number;
}

interface PixelConfig {
  pixelId: string;
  events: string[];
  isActive: boolean;
  lastEvent: string;
}

export default function MetaPixelManager() {
  const [loading, setLoading] = useState(true);
  const [pixelConfig, setPixelConfig] = useState<PixelConfig | null>(null);
  const [audiences, setAudiences] = useState<CustomAudience[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignMetrics[]>([]);
  const [activeTab, setActiveTab] = useState<'pixel' | 'audiences' | 'campaigns'>('pixel');
  const [showCreateLookalike, setShowCreateLookalike] = useState(false);
  const [selectedAudience, setSelectedAudience] = useState<string>('');
  const [lookalikeSimilarity, setLookalikeSimilarity] = useState<number>(1);

  useEffect(() => {
    fetchMetaData();
  }, []);

  const fetchMetaData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/meta/dashboard');
      const data = await response.json();
      setPixelConfig(data.pixelConfig);
      setAudiences(data.audiences);
      setCampaigns(data.campaigns);
    } catch (error) {
      console.error('Error fetching Meta data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createLookalikeAudience = async () => {
    if (!selectedAudience) return;

    try {
      const response = await fetch('/api/admin/meta/audiences/lookalike', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          baseAudienceId: selectedAudience,
          similarity: lookalikeSimilarity,
        }),
      });

      if (response.ok) {
        const newAudience = await response.json();
        setAudiences([...audiences, newAudience]);
        setShowCreateLookalike(false);
        setSelectedAudience('');
        setLookalikeSimilarity(1);
      }
    } catch (error) {
      console.error('Error creating lookalike audience:', error);
    }
  };

  const getAudienceTypeColor = (type: string) => {
    switch (type) {
      case 'purchasers': return 'bg-blue-100 text-blue-800';
      case 'high_value': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'cart_abandoners': return 'bg-yellow-100 text-yellow-800';
      case 'frequent_buyers': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCampaignStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Meta Pixel & Ads Manager</h1>
        <p className="text-gray-600">Gestiona tu pixel de Meta y campañas publicitarias</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('pixel')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'pixel'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Pixel Configuration
          </button>
          <button
            onClick={() => setActiveTab('audiences')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'audiences'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Audiencias ({audiences.length})
          </button>
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'campaigns'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Campañas ({campaigns.length})
          </button>
        </nav>
      </div>

      {/* Pixel Configuration Tab */}
      {activeTab === 'pixel' && pixelConfig && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuración del Pixel</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pixel ID
                </label>
                <input
                  type="text"
                  value={pixelConfig.pixelId}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${pixelConfig.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-sm text-gray-700">
                    {pixelConfig.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Eventos Configurados
              </label>
              <div className="flex flex-wrap gap-2">
                {pixelConfig.events.map((event) => (
                  <span
                    key={event}
                    className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                  >
                    {event}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Último Evento
              </label>
              <p className="text-sm text-gray-600">
                {new Date(pixelConfig.lastEvent).toLocaleString('es-MX')}
              </p>
            </div>
          </div>

          {/* Pixel Code Preview */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Código del Pixel</h3>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto">
              <pre className="text-sm">
{`<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${pixelConfig.pixelId}');
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=${pixelConfig.pixelId}&ev=PageView&noscript=1"
/></noscript>
<!-- End Meta Pixel Code -->`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Audiences Tab */}
      {activeTab === 'audiences' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Audiencias Personalizadas</h3>
            <button
              onClick={() => setShowCreateLookalike(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
            >
              Crear Lookalike
            </button>
          </div>

          {/* Create Lookalike Modal */}
          {showCreateLookalike && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Crear Audiencia Lookalike</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Audiencia Base
                      </label>
                      <select
                        value={selectedAudience}
                        onChange={(e) => setSelectedAudience(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Seleccionar audiencia</option>
                        {audiences.map((audience) => (
                          <option key={audience.id} value={audience.id}>
                            {audience.name} ({audience.size} usuarios)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Similitud (%)
                      </label>
                      <select
                        value={lookalikeSimilarity}
                        onChange={(e) => setLookalikeSimilarity(parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value={1}>1% (Más amplia)</option>
                        <option value={3}>3% (Equilibrada)</option>
                        <option value={5}>5% (Más específica)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      onClick={() => setShowCreateLookalike(false)}
                      className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={createLookalikeAudience}
                      disabled={!selectedAudience}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      Crear
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {audiences.map((audience) => (
              <div key={audience.id} className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900">{audience.name}</h4>
                  <span className={`px-2 py-1 text-xs rounded-full ${getAudienceTypeColor(audience.criteria.type)}`}>
                    {audience.criteria.type.replace('_', ' ')}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-4">{audience.description}</p>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tamaño:</span>
                    <span className="font-medium">{audience.size.toLocaleString()} usuarios</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Actualizada:</span>
                    <span className="font-medium">
                      {new Date(audience.lastUpdated).toLocaleDateString('es-MX')}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <button className="w-full px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">
                    Ver Detalles
                  </button>
                </div>
              </div>
            ))}
          </div>

          {audiences.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No hay audiencias personalizadas creadas</p>
            </div>
          )}
        </div>
      )}

      {/* Campaigns Tab */}
      {activeTab === 'campaigns' && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Campañas Publicitarias</h3>
          
          <div className="bg-white shadow-sm border rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Campaña
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Presupuesto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gastado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Conversiones
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ROAS
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {campaigns.map((campaign) => (
                  <tr key={campaign.campaignId}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getCampaignStatusColor(campaign.status)}`}>
                        {campaign.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${campaign.budget.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${campaign.spent.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {campaign.conversions}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {campaign.returnOnAdSpend.toFixed(2)}x
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {campaigns.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No hay campañas activas</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
