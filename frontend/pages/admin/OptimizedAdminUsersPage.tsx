import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { getUsers, createUser, updateUser, deleteUser } from '../../services/api';
import { AdminUser } from '../../types';
import { Plus, Edit, Trash2, X, User, Shield, Search, Filter, MoreVertical } from 'lucide-react';
import Spinner from '../../components/Spinner';

const OptimizedUserFormModal = ({ 
    user, 
    onClose, 
    onSave 
}: { 
    user: Partial<AdminUser> | null, 
    onClose: () => void, 
    onSave: (data: AdminUser) => void 
}) => {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<AdminUser>({
        defaultValues: user || {}
    });

    const onSubmit = (data: AdminUser) => {
        onSave({ ...user, ...data });
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
                        <input 
                            {...register('name', { required: 'El nombre es requerido' })} 
                            className={inputClasses} 
                            placeholder="Ej: Juan Pérez"
                        />
                        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message as React.ReactNode}</p>}
                    </div>
                    
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                        <input 
                            {...register('email', { 
                                required: 'El email es requerido', 
                                pattern: { 
                                    value: /^\S+@\S+$/i, 
                                    message: 'Email inválido' 
                                } 
                            })} 
                            type="email"
                            className={inputClasses} 
                            placeholder="Ej: juan@email.com"
                        />
                        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message as React.ReactNode}</p>}
                    </div>
                    
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Contraseña</label>
                        <input 
                            {...register('password', { 
                                required: 'La contraseña es requerida', 
                                minLength: { 
                                    value: 6, 
                                    message: 'Mínimo 6 caracteres' 
                                } 
                            })} 
                            type="password" 
                            className={inputClasses}
                            placeholder="Mínimo 6 caracteres"
                        />
                        {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message as React.ReactNode}</p>}
                    </div>
                    
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Rol</label>
                        <select {...register('role')} className={inputClasses}>
                            <option value="user">Usuario</option>
                            <option value="admin">Administrador</option>
                        </select>
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
    );
};

const OptimizedAdminUsersPage: React.FC = () => {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<Partial<AdminUser> | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'admin'>('all');

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await getUsers();
            setUsers(data);
        } catch (error) {
            console.error('Error fetching users:', error);
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
            if (data.id) {
                await updateUser(data.id, data);
            } else {
                await createUser(data);
            }
            await fetchUsers();
            handleCloseModal();
        } catch (error) {
            console.error('Error saving user:', error);
            alert("Error al guardar el usuario.");
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
            try {
                await deleteUser(userId);
                await fetchUsers();
            } catch (error) {
                console.error('Error deleting user:', error);
                alert("Error al eliminar el usuario.");
            }
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'admin': return 'bg-red-100 text-red-800 border-red-200';
            case 'user': return 'bg-blue-100 text-blue-800 border-blue-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getRoleIcon = (role: string) => {
        return role === 'admin' ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />;
    };

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
            {/* Header compacto */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Usuarios</h1>
                    <p className="text-gray-600 text-sm">Gestiona los usuarios de tu plataforma</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-200 shadow-lg text-sm"
                >
                    <Plus className="w-4 h-4" />
                    <span>Nuevo Usuario</span>
                </button>
            </div>

            {/* Controles de filtrado */}
            <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-200">
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
                            <option value="user">Usuarios</option>
                            <option value="admin">Administradores</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Lista de usuarios */}
            <div className="space-y-4">
                <AnimatePresence>
                    {filteredUsers.map((user) => (
                        <motion.div
                            key={user.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-xl"
                        >
                            <div className="p-4 md:p-6">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    {/* Información del usuario */}
                                    <div className="flex items-center space-x-4">
                                        <div className="p-3 bg-blue-100 rounded-xl">
                                            {getRoleIcon(user.role)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg font-bold text-gray-900 truncate">{user.name}</h3>
                                            <p className="text-sm text-gray-600 truncate">{user.email}</p>
                                            <div className="flex items-center space-x-2 mt-2">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(user.role)}`}>
                                                    {getRoleIcon(user.role)}
                                                    <span className="ml-1 capitalize">{user.role}</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Acciones */}
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => handleOpenModal(user)}
                                            className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all duration-200"
                                            title="Editar usuario"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteUser(user.id)}
                                            className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all duration-200"
                                            title="Eliminar usuario"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

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
            </div>

            {/* Modal de formulario */}
            <AnimatePresence>
                {isModalOpen && (
                    <OptimizedUserFormModal
                        user={editingUser}
                        onClose={handleCloseModal}
                        onSave={handleSaveUser}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default OptimizedAdminUsersPage;
