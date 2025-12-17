import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { getUsers, createUser, updateUser, deleteUser } from '../../services/api';
import { AdminUser } from '../../types';
import { Plus, Edit, Trash2, X, User, Search } from 'lucide-react';
import Spinner from '../../components/Spinner';

// Modal for Add/Edit User
const UserFormModal = ({ user, onClose, onSave }: { user: Partial<AdminUser> | null, onClose: () => void, onSave: (data: AdminUser) => void }) => {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<AdminUser>({
        defaultValues: user || { role: 'ventas' }
    });

    const onSubmit = (data: any) => {
        onSave(data);
    };

    const inputClasses = "w-full mt-1 p-3 border border-gray-300 rounded-xl bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200";

    return (
        <motion.div
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, y: -20 }} 
                animate={{ scale: 1, y: 0 }} 
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            {user?.id ? 'Editar Usuario' : 'Nuevo Usuario'}
                        </h2>
                        <p className="text-sm text-gray-600">
                            {user?.id ? 'Modifica la información del usuario' : 'Agrega un nuevo usuario al sistema'}
                        </p>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-all duration-200"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre Completo</label>
                        <input {...register('name', { required: 'El nombre es requerido' })} className={inputClasses} placeholder="Ej: Juan Pérez" />
                         {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message as React.ReactNode}</p>}
                    </div>
                     <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Usuario</label>
                        <input {...register('username', { required: 'El usuario es requerido', minLength: { value: 3, message: 'Mínimo 3 caracteres' } })} className={inputClasses} placeholder="Ej: Orlando12" />
                        {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message as React.ReactNode}</p>}
                    </div>
                     <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Contraseña {user?.id && '(dejar vacío para no cambiar)'}
                        </label>
                        <input 
                            {...register('password', { 
                                required: user?.id ? false : 'La contraseña es requerida', 
                                minLength: { value: 6, message: 'Mínimo 6 caracteres' } 
                            })} 
                            type="password" 
                            className={inputClasses} 
                            placeholder="Ej: Pomelo_12@" 
                        />
                        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message as React.ReactNode}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Rol</label>
                        <select {...register('role', { required: 'El rol es requerido' })} className={inputClasses}>
                            <option value="admin">Administrador</option>
                            <option value="ventas">Ventas</option>
                        </select>
                        {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role.message as React.ReactNode}</p>}
                    </div>
                    
                    <div className="flex items-center justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Guardando...' : (user?.id ? 'Actualizar' : 'Crear')}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    )
};


const AdminUsersPage = () => {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<Partial<AdminUser> | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'ventas'>('all');

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await getUsers();
            setUsers(data);
        } catch (error) {
            console.error('Error fetching users:', error);
            const errorMessage = error instanceof Error ? error.message : 'Error al cargar usuarios';
            alert(errorMessage);
            setUsers([]); // Limpiar lista en caso de error
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleOpenModal = (user: Partial<AdminUser> | null = null) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingUser(null);
        setIsModalOpen(false);
    };

    const handleSaveUser = async (data: AdminUser) => {
        try {
            console.log('💾 Guardando usuario:', { data, editingUser });
            
            if (editingUser?.id) {
                // Editar usuario existente
                const updateData: any = { 
                    name: data.name,
                    username: data.username,
                    role: data.role
                };
                // Solo incluir contraseña si se proporcionó una nueva
                if (data.password && data.password.trim() !== '') {
                    updateData.password = data.password;
                    console.log('🔑 Actualizando contraseña');
                }
                console.log('📝 Datos a actualizar:', updateData);
                await updateUser(editingUser.id, updateData);
            } else {
                // Crear nuevo usuario
                const newUser = { 
                    name: data.name,
                    username: data.username,
                    password: data.password || '',
                    role: data.role
                };
                console.log('➕ Creando nuevo usuario:', newUser);
                await createUser(newUser);
            }
            await fetchUsers();
            handleCloseModal();
        } catch (error) {
            console.error("❌ Failed to save user", error);
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido al guardar el usuario';
            alert(`Error al guardar el usuario: ${errorMessage}`);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
            try {
                console.log('🗑️ Eliminando usuario con ID:', userId);
                await deleteUser(userId);
                console.log('✅ Usuario eliminado correctamente');
                await fetchUsers();
            } catch (error) {
                console.error("❌ Failed to delete user", error);
                const errorMessage = error instanceof Error ? error.message : 'Error desconocido al eliminar el usuario';
                alert(`Error al eliminar el usuario: ${errorMessage}`);
            }
        }
    };

    const filteredUsers = users.filter(user => {
        // Filtrar el superadmin - no debe aparecer en la lista
        if (user.role === 'superadmin') return false;
        
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            user.username.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-center">
                    <Spinner />
                    <p className="mt-4 text-gray-600">Cargando usuarios...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header simplificado */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center space-x-3">
                        <div className="p-3 bg-blue-100 rounded-xl">
                            <User className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
                            <p className="text-gray-600">Gestiona los usuarios del sistema</p>
                        </div>
                    </div>
                    
                    <div className="flex gap-3">
                        <button
                            onClick={() => handleOpenModal()}
                            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Nuevo Usuario</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Controles simplificados */}
            <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-200 mb-6">
                <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                    {/* Búsqueda */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar usuarios..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm"
                        />
                    </div>

                    {/* Filtros */}
                    <div className="flex items-center space-x-2">
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value as any)}
                            className="px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm"
                        >
                            <option value="all">Todos los roles</option>
                            <option value="admin">Administradores</option>
                            <option value="ventas">Ventas</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Lista de usuarios simplificada */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AnimatePresence>
                    {filteredUsers.map((user) => (
                        <motion.div
                            key={user.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow"
                        >
                            {/* Información esencial */}
                            <div className="mb-4">
                                <h3 className="text-lg font-bold text-gray-900 mb-2">{user.name}</h3>
                                <div className="space-y-1 text-sm text-gray-600">
                                    <p>👤 Usuario: {user.username}</p>
                                    <p className={`font-bold ${user.role === 'admin' ? 'text-red-600' : user.role === 'ventas' ? 'text-blue-600' : 'text-purple-600'}`}>
                                        {user.role === 'superadmin' ? '👑 Super Admin' : user.role === 'admin' ? '🛡️ Administrador' : '💰 Ventas'}
                                    </p>
                                </div>
                            </div>

                            {/* Botones de acción */}
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => handleOpenModal(user)}
                                    className="flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm"
                                >
                                    <Edit className="w-4 h-4" />
                                    <span>Editar</span>
                                </button>
                                
                                <button
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="flex items-center justify-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors text-sm"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    <span>Eliminar</span>
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

                {filteredUsers.length === 0 && (
                    <div className="text-center py-12">
                        <div className="text-gray-400 mb-4">
                            <User className="w-16 h-16 mx-auto" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron usuarios</h3>
                        <p className="text-gray-600 mb-4">Intenta ajustar los filtros o crear un nuevo usuario</p>
                        <button
                            onClick={() => handleOpenModal()}
                            className="bg-blue-500 text-white px-6 py-3 rounded-xl hover:bg-blue-600 transition-all duration-200"
                        >
                            Crear Nuevo Usuario
                        </button>
                    </div>
                )}

            {/* Modal de formulario */}
            <AnimatePresence>
                {isModalOpen && <UserFormModal user={editingUser} onClose={handleCloseModal} onSave={handleSaveUser} />}
            </AnimatePresence>
        </div>
    );
};

export default AdminUsersPage;
