import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { adminGetUsers, adminCreateUser, adminUpdateUser, adminDeleteUser } from '../../services/api';
import { AdminUser } from '../../types';
import { Plus, Edit, Trash2, X, User, Shield } from 'lucide-react';
import Spinner from '../../components/Spinner';

// Modal for Add/Edit User
const UserFormModal = ({ user, onClose, onSave }: { user: Partial<AdminUser> | null, onClose: () => void, onSave: (data: AdminUser) => void }) => {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<AdminUser>({
        defaultValues: user || { role: 'Editor' }
    });

    const onSubmit = (data: AdminUser) => {
        onSave({ ...user, ...data });
    };

    const inputClasses = "w-full mt-1 p-2 border rounded-md bg-white text-gray-800 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, y: -20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h2 className="text-2xl font-bold text-gray-800">{user?.id ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
                    <button onClick={onClose} className="p-2 rounded-full text-gray-500 hover:bg-gray-200"><X /></button>
                </div>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-600">Nombre Completo</label>
                        <input {...register('name', { required: 'El nombre es requerido' })} className={inputClasses} />
                         {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message as React.ReactNode}</p>}
                    </div>
                     <div>
                        <label className="text-sm font-medium text-gray-600">Nombre de Usuario</label>
                        <input {...register('username', { required: 'El nombre de usuario es requerido' })} className={inputClasses} />
                        {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message as React.ReactNode}</p>}
                    </div>
                     <div>
                        <label className="text-sm font-medium text-gray-600">Rol</label>
                        <select {...register('role', { required: true })} className={inputClasses}>
                            <option value="Editor">Editor</option>
                            <option value="Administrator">Administrator</option>
                        </select>
                    </div>
                    
                    <div className="flex justify-end gap-3 pt-6 border-t mt-6">
                        <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300">Cancelar</button>
                        <button type="submit" disabled={isSubmitting} className="py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
                            {isSubmitting ? 'Guardando...' : 'Guardar Usuario'}
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

    const fetchUsers = async () => {
        setLoading(true);
        const data = await adminGetUsers();
        setUsers(data);
        setLoading(false);
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
            if (editingUser?.id) {
                await adminUpdateUser({ ...editingUser, ...data });
            } else {
                // @ts-ignore
                await adminCreateUser(data);
            }
            fetchUsers();
            handleCloseModal();
        } catch (error) {
            console.error("Failed to save user", error);
            alert("Error al guardar el usuario.");
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
            try {
                await adminDeleteUser(userId);
                fetchUsers();
            } catch (error) {
                 console.error("Failed to delete user", error);
                 alert("Error al eliminar el usuario.");
            }
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold text-gray-800">Usuarios</h1>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 w-full sm:w-auto"
                >
                    <Plus size={20} />
                    <span>Nuevo Usuario</span>
                </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
                {loading ? <Spinner /> : (
                    <div className="space-y-4">
                        {users.map(user => (
                            <div key={user.id} className="p-4 border rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="p-3 bg-gray-100 rounded-full flex-shrink-0">
                                        <User className="text-gray-500"/>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-gray-800 truncate">{user.name}</p>
                                        <p className="text-sm text-gray-500 truncate">{user.username}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                                     <span className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full ${user.role === 'Administrator' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                                        <Shield size={14} />
                                        {user.role}
                                    </span>
                                    <button
                                        onClick={() => handleOpenModal(user)}
                                        className="py-2 px-4 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600"
                                    >
                                        Editar
                                    </button>
                                     <button
                                        onClick={() => handleDeleteUser(user.id)}
                                        className="py-2 px-4 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

             <AnimatePresence>
                {isModalOpen && <UserFormModal user={editingUser} onClose={handleCloseModal} onSave={handleSaveUser} />}
            </AnimatePresence>
        </motion.div>
    );
};

export default AdminUsersPage;
