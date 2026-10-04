import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import { formatCurrency } from '../utils/helpers';
import Table from '../components/common/Table';
import Modal from '../components/common/Modal';
import Toast from '../components/common/Toast';
import Badge from '../components/common/Badge';
import Loader from '../components/common/Loader';
import { Search, Plus, PackagePlus, Edit2 } from 'lucide-react';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toastMsg, setToastMsg] = useState(null);

  // Modal controls
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Form inputs
  const [formData, setFormData] = useState({
    itemName: '',
    size: '',
    colour: '',
    gsm: 0,
    packing: '',
    basePrice: 0,
    status: 'Active',
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchProducts();

    // Check query params to open modal
    if (searchParams.get('action') === 'add') {
      triggerNewForm();
      setSearchParams({});
    }
  }, [searchParams]);

  const fetchProducts = async (searchVal = '') => {
    try {
      setLoading(true);
      const res = await api.get(`/api/products?search=${searchVal}`);
      if (res.data.success) {
        setProducts(res.data.products);
      }
    } catch (error) {
      setToastMsg({ text: 'Failed to load products list', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    fetchProducts(e.target.value);
  };

  const triggerNewForm = () => {
    setSelectedProduct(null);
    setFormData({
      itemName: '',
      size: '',
      colour: '',
      gsm: 0,
      packing: '',
      basePrice: 0,
      status: 'Active',
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const triggerEditForm = (product) => {
    setSelectedProduct(product);
    setFormData({
      itemName: product.itemName,
      size: product.size || '',
      colour: product.colour || '',
      gsm: product.gsm || 0,
      packing: product.packing || '',
      basePrice: product.basePrice,
      status: product.status,
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.itemName.trim()) errors.itemName = 'Item Name is required';
    if (formData.basePrice === undefined || formData.basePrice === '') {
      errors.basePrice = 'Base Price is required';
    } else if (Number(formData.basePrice) < 0) {
      errors.basePrice = 'Price cannot be negative';
    }
    if (formData.gsm && Number(formData.gsm) < 0) {
      errors.gsm = 'GSM value must be positive';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      let res;
      const formattedData = {
        ...formData,
        gsm: Number(formData.gsm) || 0,
        basePrice: Number(formData.basePrice) || 0,
      };

      if (selectedProduct) {
        // Edit Mode
        res = await api.put(`/api/products/${selectedProduct._id}`, formattedData);
        if (res.data.success) {
          setToastMsg({ text: 'Product updated successfully', type: 'success' });
        }
      } else {
        // Add Mode
        res = await api.post('/api/products', formattedData);
        if (res.data.success) {
          setToastMsg({ text: 'Product created successfully', type: 'success' });
        }
      }
      setIsFormOpen(false);
      fetchProducts(search);
    } catch (error) {
      setToastMsg({
        text: error.response?.data?.message || 'Error occurred while saving product',
        type: 'error',
      });
    }
  };

  const tableHeaders = [
    { label: 'Item Name' },
    { label: 'Size' },
    { label: 'Colour' },
    { label: 'Quality (GSM)' },
    { label: 'Packing' },
    { label: 'Base Rate', className: 'text-right' },
    { label: 'Status', className: 'text-center' },
    { label: 'Actions', className: 'text-center' },
  ];

  return (
    <div className="space-y-6">
      {/* Title Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-850 dark:text-white">
            Products Catalog
          </h1>
          <p className="text-slate-450 dark:text-slate-400 text-sm font-medium mt-1">
            Configure sizes, color varieties, grammages (GSM), and base pricing matrix
          </p>
        </div>
        <button
          onClick={triggerNewForm}
          className="flex items-center justify-center space-x-2 py-2.5 px-4 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl shadow-lg shadow-primary-500/20 active:scale-95 transition-all text-sm self-start sm:self-auto"
        >
          <PackagePlus className="h-4.5 w-4.5" />
          <span>New Product</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md w-full glass-panel border border-slate-200/60 rounded-xl">
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
          <Search className="h-4.5 w-4.5" />
        </span>
        <input
          type="text"
          value={search}
          onChange={handleSearchChange}
          placeholder="Search by name, size, colour..."
          className="w-full bg-transparent pl-11 pr-4 py-2.5 focus:outline-none text-sm placeholder-slate-400 dark:text-white"
        />
      </div>

      {/* Grid List Table */}
      {loading && products.length === 0 ? (
        <Loader size="md" />
      ) : (
        <Table
          headers={tableHeaders}
          data={products}
          loading={loading}
          emptyMessage="No products cataloged yet"
          renderRow={(product) => (
            <tr key={product._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/10">
              <td className="px-6 py-4 font-semibold text-slate-850 dark:text-slate-200">
                {product.itemName}
              </td>
              <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-350">
                {product.size || '-'}
              </td>
              <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-350">
                {product.colour || '-'}
              </td>
              <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-350">
                {product.gsm ? `${product.gsm} GSM` : '-'}
              </td>
              <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-350">
                {product.packing || '-'}
              </td>
              <td className="px-6 py-4 text-right font-bold text-slate-850 dark:text-slate-100">
                {formatCurrency(product.basePrice)}
              </td>
              <td className="px-6 py-4 text-center">
                <Badge text={product.status} />
              </td>
              <td className="px-6 py-4 text-center">
                <button
                  onClick={() => triggerEditForm(product)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-lg transition-colors"
                  title="Edit Product"
                >
                  <Edit2 className="h-4.5 w-4.5" />
                </button>
              </td>
            </tr>
          )}
        />
      )}

      {/* Product Editor Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedProduct ? 'Edit Catalog Product' : 'Add New Product to Catalog'}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Item Name *
              </label>
              <input
                type="text"
                name="itemName"
                value={formData.itemName}
                onChange={handleInputChange}
                className={`w-full p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${
                  formErrors.itemName ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'
                }`}
                placeholder="e.g. Heavy Duty Bags"
              />
              {formErrors.itemName && (
                <p className="text-rose-500 text-xs font-semibold">{formErrors.itemName}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Base Rate (INR) *
              </label>
              <input
                type="number"
                name="basePrice"
                value={formData.basePrice === 0 ? '' : formData.basePrice}
                onChange={handleInputChange}
                className={`w-full p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${
                  formErrors.basePrice ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'
                }`}
                placeholder="0.00"
                step="0.01"
              />
              {formErrors.basePrice && (
                <p className="text-rose-500 text-xs font-semibold">{formErrors.basePrice}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Size Description
              </label>
              <input
                type="text"
                name="size"
                value={formData.size}
                onChange={handleInputChange}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                placeholder="e.g. 15x20 inches, A4"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Colour
              </label>
              <input
                type="text"
                name="colour"
                value={formData.colour}
                onChange={handleInputChange}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                placeholder="e.g. Royal Blue, White"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Material Quality (GSM)
              </label>
              <input
                type="number"
                name="gsm"
                value={formData.gsm === 0 ? '' : formData.gsm}
                onChange={handleInputChange}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                placeholder="e.g. 120, 250"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Packing Style
              </label>
              <input
                type="text"
                name="packing"
                value={formData.packing}
                onChange={handleInputChange}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                placeholder="e.g. Bundle of 100"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Catalog Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 font-semibold"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-700/50">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="py-2.5 px-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-250 font-bold rounded-lg text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2.5 px-4 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-lg shadow-sm text-sm"
            >
              Save Product
            </button>
          </div>
        </form>
      </Modal>

      {/* Floating Notifications */}
      {toastMsg && (
        <Toast
          message={toastMsg.text}
          type={toastMsg.type}
          onClose={() => setToastMsg(null)}
        />
      )}
    </div>
  );
};

export default Products;
