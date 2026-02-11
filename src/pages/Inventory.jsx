import React, { useState, useEffect } from 'react';
import {
    Package,
    Search,
    Plus,
    AlertTriangle,
    TrendingDown,
    Calendar,
    Edit2,
    Trash2,
    Save,
    X,
    Filter
} from 'lucide-react';
import { storage } from '../data/storage';

const Inventory = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, low, expired
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        category: 'Consumables',
        quantity: 0,
        unit: 'pcs',
        minLevel: 10,
        expiryDate: '',
        supplier: ''
    });

    useEffect(() => {
        setLoading(true);
        const unsubscribe = storage.subscribeToInventory((data) => {
            setItems(data);
            setLoading(false);
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []);

    const loadInventory = async () => {
        // Redundant if subscribed, but kept for manual refresh if needed elsewhere or failed sub
        const data = await storage.getInventory();
        setItems(data);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingItem) {
                await storage.updateInventoryItem(editingItem.id, formData);
            } else {
                await storage.saveInventoryItem(formData);
            }
            loadInventory();
            setIsModalOpen(false);
            resetForm();
        } catch (error) {
            console.error("Failed to save item", error);
            if (error.code === 'permission-denied' || error.message?.includes('permission-denied')) {
                alert("Permission Denied: Ask Admin to check Firestore Rules.");
            } else {
                alert("Failed to save item. Please check connection.");
            }
        }
    };

    const handleInitializeStock = async () => {
        if (!confirm('Add standard test tubes to inventory? (EDTA, SST, Fluoride, Citrate, Urine Container)')) return;

        try {
            const defaults = [
                { name: 'EDTA Vacutainer (Lavender)', category: 'Consumables', quantity: 100, unit: 'pcs', minLevel: 20 },
                { name: 'SST Vacutainer (Yellow)', category: 'Consumables', quantity: 100, unit: 'pcs', minLevel: 20 },
                { name: 'Fluoride Vacutainer (Grey)', category: 'Consumables', quantity: 50, unit: 'pcs', minLevel: 10 },
                { name: 'Citrate Vacutainer (Blue)', category: 'Consumables', quantity: 50, unit: 'pcs', minLevel: 10 },
                { name: 'Urine Container', category: 'Consumables', quantity: 100, unit: 'pcs', minLevel: 20 },
                { name: 'Vacutainer Needle (21G)', category: 'Consumables', quantity: 200, unit: 'pcs', minLevel: 50 },
                { name: 'Alcohol Swab', category: 'Consumables', quantity: 200, unit: 'pcs', minLevel: 50 },
                { name: 'Band-Aid (Spot)', category: 'Consumables', quantity: 200, unit: 'pcs', minLevel: 50 },
                { name: 'Latex Gloves', category: 'Consumables', quantity: 100, unit: 'pairs', minLevel: 20 },
            ];

            for (const item of defaults) {
                // Check if exists
                const exists = items.some(i => i.name === item.name);
                if (!exists) {
                    await storage.saveInventoryItem(item);
                }
            }
            loadInventory();
            alert('Standard stock initialized!');
        } catch (error) {
            console.error("Failed to initialize stock", error);
            if (error.code === 'permission-denied' || error.message?.includes('permission-denied')) {
                alert("Permission Denied: Ask Admin to check Firestore Rules.");
            } else {
                alert("Failed to initialize stock.");
            }
        }
    };

    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this item?')) {
            try {
                await storage.deleteInventoryItem(id);
                loadInventory();
            } catch (error) {
                console.error("Failed to delete item", error);
                if (error.code === 'permission-denied' || error.message?.includes('permission-denied')) {
                    alert("Permission Denied: Ask Admin to check Firestore Rules.");
                } else {
                    alert("Failed to delete item.");
                }
            }
        }
    };

    const handleStockUpdate = async (item, change) => {
        const newQuantity = Number(item.quantity) + change;
        if (newQuantity < 0) return;

        // Optimistic update
        const originalItems = [...items];
        setItems(items.map(i => i.id === item.id ? { ...i, quantity: newQuantity } : i));

        try {
            await storage.updateInventoryItem(item.id, { quantity: newQuantity });
        } catch (error) {
            console.error("Failed to update stock", error);
            // Revert optimistic update
            setItems(originalItems);
            if (error.code === 'permission-denied' || error.message?.includes('permission-denied')) {
                alert("Permission Denied: Ask Admin to check Firestore Rules.");
            } else {
                alert("Failed to update stock.");
            }
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            category: 'Consumables',
            quantity: 0,
            unit: 'pcs',
            minLevel: 10,
            expiryDate: '',
            supplier: ''
        });
        setEditingItem(null);
    };

    const openEdit = (item) => {
        setEditingItem(item);
        setFormData(item);
        setIsModalOpen(true);
    };

    // Filter Logic
    const filteredItems = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
            item.category.toLowerCase().includes(search.toLowerCase());

        if (!matchesSearch) return false;

        const isLowStock = Number(item.quantity) <= Number(item.minLevel);
        const isExpired = item.expiryDate && new Date(item.expiryDate) < new Date();

        if (filter === 'low') return isLowStock;
        if (filter === 'expired') return isExpired;
        return true;
    });

    // Stats
    const totalItems = items.length;
    const lowStockCount = items.filter(i => Number(i.quantity) <= Number(i.minLevel)).length;
    const expiredCount = items.filter(i => i.expiryDate && new Date(i.expiryDate) < new Date()).length;

    return (
        <div className="max-w-7xl mx-auto pb-12 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center">
                        <Package className="mr-3 h-8 w-8 text-indigo-600" />
                        Inventory Management
                    </h1>
                    <p className="text-slate-500">Track stock levels, consumables, and expiry dates.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleInitializeStock}
                        className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl font-bold flex items-center hover:bg-emerald-200 transition-colors"
                    >
                        <Package className="h-5 w-5 mr-2" /> Initialize Stock
                    </button>
                    <button
                        onClick={() => { resetForm(); setIsModalOpen(true); }}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold flex items-center shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors"
                    >
                        <Plus className="h-5 w-5 mr-2" /> Add Item
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center">
                    <div className="p-4 bg-blue-50 text-blue-600 rounded-xl mr-4">
                        <Package className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Items</p>
                        <h3 className="text-2xl font-bold text-slate-800">{totalItems}</h3>
                    </div>
                </div>
                <div
                    onClick={() => setFilter('low')}
                    className={`p-6 rounded-2xl shadow-sm border flex items-center cursor-pointer transition-all ${filter === 'low' ? 'bg-amber-50 border-amber-200 ring-2 ring-amber-100' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                >
                    <div className="p-4 bg-amber-100 text-amber-600 rounded-xl mr-4">
                        <TrendingDown className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Low Stock</p>
                        <h3 className="text-2xl font-bold text-slate-800">{lowStockCount}</h3>
                    </div>
                </div>
                <div
                    onClick={() => setFilter('expired')}
                    className={`p-6 rounded-2xl shadow-sm border flex items-center cursor-pointer transition-all ${filter === 'expired' ? 'bg-rose-50 border-rose-200 ring-2 ring-rose-100' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                >
                    <div className="p-4 bg-rose-100 text-rose-600 rounded-xl mr-4">
                        <AlertTriangle className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Expired / Expiring</p>
                        <h3 className="text-2xl font-bold text-slate-800">{expiredCount}</h3>
                    </div>
                </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search items..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${filter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        All Items
                    </button>
                    <button
                        onClick={() => setFilter('low')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${filter === 'low' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        Low Stock
                    </button>
                </div>
            </div>

            {/* Inventory Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="p-4 font-bold text-slate-500 text-xs uppercase tracking-wider">Item Name</th>
                            <th className="p-4 font-bold text-slate-500 text-xs uppercase tracking-wider">Category</th>
                            <th className="p-4 font-bold text-slate-500 text-xs uppercase tracking-wider">Stock Level</th>
                            <th className="p-4 font-bold text-slate-500 text-xs uppercase tracking-wider">Expiry</th>
                            <th className="p-4 font-bold text-slate-500 text-xs uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredItems.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="p-8 text-center text-slate-400">No items found.</td>
                            </tr>
                        ) : filteredItems.map(item => {
                            const isLow = Number(item.quantity) <= Number(item.minLevel);
                            const isExpired = item.expiryDate && new Date(item.expiryDate) < new Date();

                            return (
                                <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="p-4">
                                        <p className="font-bold text-slate-800">{item.name}</p>
                                        <p className="text-xs text-slate-400">{item.id}</p>
                                    </td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-600 font-medium">
                                            {item.category}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => handleStockUpdate(item, -1)}
                                                className="w-6 h-6 rounded bg-slate-100 hover:bg-rose-100 hover:text-rose-600 flex items-center justify-center transition-colors"

                                            >
                                                -
                                            </button>
                                            <div className="w-16 text-center">
                                                <span className={`font-bold text-lg ${isLow ? 'text-rose-600' : 'text-slate-800'}`}>
                                                    {item.quantity}
                                                </span>
                                                <span className="text-xs text-slate-400 ml-1">{item.unit}</span>
                                            </div>
                                            <button
                                                onClick={() => handleStockUpdate(item, 1)}
                                                className="w-6 h-6 rounded bg-slate-100 hover:bg-emerald-100 hover:text-emerald-600 flex items-center justify-center transition-colors"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        {item.expiryDate ? (
                                            <div className={`flex items-center text-sm ${isExpired ? 'text-rose-600 font-bold' : 'text-slate-600'}`}>
                                                <Calendar className="h-4 w-4 mr-2 opacity-50" />
                                                {new Date(item.expiryDate).toLocaleDateString()}
                                            </div>
                                        ) : (
                                            <span className="text-slate-300 text-xs italic">N/A</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => openEdit(item)}
                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h2 className="text-xl font-bold text-slate-800">
                                {editingItem ? 'Edit Item' : 'New Inventory Item'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Item Name</label>
                                <input
                                    required
                                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. EDTA Vacutainer"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Category</label>
                                    <select
                                        className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none"
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        <option>Consumables</option>
                                        <option>Reagents</option>
                                        <option>Kits</option>
                                        <option>Stationery</option>
                                        <option>Equipment</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Unit</label>
                                    <input
                                        className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none"
                                        value={formData.unit}
                                        onChange={e => setFormData({ ...formData, unit: e.target.value })}
                                        placeholder="pcs, box, ml"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Current Stock</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none"
                                        value={formData.quantity}
                                        onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Min. Alert Level</label>
                                    <input
                                        type="number"
                                        className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none"
                                        value={formData.minLevel}
                                        onChange={e => setFormData({ ...formData, minLevel: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Expiry Date</label>
                                    <input
                                        type="date"
                                        className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none"
                                        value={formData.expiryDate}
                                        onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Supplier</label>
                                    <input
                                        className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none"
                                        value={formData.supplier}
                                        onChange={e => setFormData({ ...formData, supplier: e.target.value })}
                                        placeholder="Optional"
                                    />
                                </div>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors flex justify-center items-center"
                                >
                                    <Save className="h-5 w-5 mr-2" />
                                    Save Item
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;
