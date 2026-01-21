
import React, { useState, useEffect } from 'react';
import { User, Permission } from '../../types';
import { BackendService } from '../../api/backend';
import { ArrowLeft, Save, Plus, Loader2, Edit, Trash } from 'lucide-react';
import CastorLogo from '../../components/CastorLogo';

interface Props {
    onBack: () => void;
}

const PERMISSIONS_LIST: { id: Permission; label: string }[] = [
    { id: 'ADMIN', label: 'Administrador Global' },
    { id: 'PRICING_ACCESS', label: 'Acceso a Tarifario' },
    { id: 'GASTRO_ACCESS', label: 'Acceso a Gastronomía' },
    { id: 'STOCK_ACCESS', label: 'Acceso a Stock' },
];

const UserManagement: React.FC<Props> = ({ onBack }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [newPass, setNewPass] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await BackendService.getUsers();
            setUsers(data);
        } catch (e) {
            alert('Error al cargar usuarios');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!editingUser) return;
        setIsSaving(true);
        try {
            // CORRECCIÓN: Solo pasamos el usuario, borramos el segundo argumento
            await BackendService.saveUser(editingUser); 
            
            await loadUsers();
            setEditingUser(null);
            setNewPass('');
        } catch (e) {
            alert('Error al guardar');
        } finally {
            setIsSaving(false);
        }
    };

    const togglePermission = (perm: Permission) => {
        if (!editingUser) return;
        const current = editingUser.permissions;
        if (current.includes(perm)) {
            setEditingUser({ ...editingUser, permissions: current.filter(p => p !== perm) });
        } else {
            setEditingUser({ ...editingUser, permissions: [...current, perm] });
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <header className="bg-slate-800 text-white p-4 shadow-lg">
                <div className="flex items-center gap-4 max-w-6xl mx-auto">
                    <button onClick={onBack} className="bg-slate-700 hover:bg-slate-600 p-2 rounded transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-xl font-bold uppercase tracking-wide">Administración de Usuarios</h1>
                </div>
            </header>

            <main className="max-w-6xl mx-auto p-6">
                
                {/* List */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-gray-700">Usuarios Registrados</h2>
                        <button 
                            onClick={() => setEditingUser({ email: '', name: '', permissions: [] })}
                            className="bg-castor-red text-white px-4 py-2 rounded hover:bg-red-700 flex items-center gap-2 text-sm"
                        >
                            <Plus size={16} /> Nuevo Usuario
                        </button>
                    </div>

                    {loading ? (
                        <div className="text-center py-10"><Loader2 className="animate-spin mx-auto text-castor-red" /></div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Nombre</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Email</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Permisos</th>
                                        <th className="px-6 py-3 text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {users.map(u => (
                                        <tr key={u.email}>
                                            <td className="px-6 py-4 whitespace-nowrap">{u.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-500">{u.email}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {u.permissions.map(p => (
                                                        <span key={p} className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full">{p}</span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button onClick={() => setEditingUser(u)} className="text-blue-600 hover:text-blue-900 mr-4">
                                                    <Edit size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Modal / Editor */}
                {editingUser && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
                            <h3 className="text-xl font-bold mb-4 border-b pb-2">
                                {users.find(u => u.email === editingUser.email) ? 'Editar Usuario' : 'Nuevo Usuario'}
                            </h3>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email</label>
                                    <input 
                                        type="email" 
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                                        value={editingUser.email}
                                        disabled={!!users.find(u => u.email === editingUser.email)}
                                        onChange={e => setEditingUser({...editingUser, email: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Nombre Completo</label>
                                    <input 
                                        type="text" 
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                                        value={editingUser.name}
                                        onChange={e => setEditingUser({...editingUser, name: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        {users.find(u => u.email === editingUser.email) ? 'Nueva Contraseña (dejar vacío para no cambiar)' : 'Contraseña'}
                                    </label>
                                    <input 
                                        type="password" 
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                                        value={newPass}
                                        onChange={e => setNewPass(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Permisos de Acceso</label>
                                    <div className="grid grid-cols-1 gap-2 bg-gray-50 p-3 rounded border">
                                        {PERMISSIONS_LIST.map(perm => (
                                            <label key={perm.id} className="flex items-center space-x-2 cursor-pointer">
                                                <input 
                                                    type="checkbox"
                                                    checked={editingUser.permissions.includes(perm.id)}
                                                    onChange={() => togglePermission(perm.id)}
                                                    className="rounded text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className="text-sm text-gray-700">{perm.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end gap-3">
                                <button 
                                    onClick={() => { setEditingUser(null); setNewPass(''); }}
                                    className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded border"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded flex items-center gap-2"
                                >
                                    {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />} Guardar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
};

export default UserManagement;
