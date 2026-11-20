const CREATED_PRODUCTS_KEY = 'createdProducts';
const DELETED_PRODUCT_IDS_KEY = 'deletedProductIds';
const PRODUCT_STORAGE_EVENT = 'product-storage-updated';

function parseStoredArray(rawValue) {
    if (!rawValue) return [];
    try {
        const parsed = JSON.parse(rawValue);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function dispatchStorageUpdate(key) {
    window.dispatchEvent(new CustomEvent(PRODUCT_STORAGE_EVENT, { detail: { key } }));
}

export function getCreatedProducts() {
    return parseStoredArray(localStorage.getItem(CREATED_PRODUCTS_KEY));
}

export function saveCreatedProducts(products) {
    localStorage.setItem(CREATED_PRODUCTS_KEY, JSON.stringify(products));
    dispatchStorageUpdate(CREATED_PRODUCTS_KEY);
}

export function addCreatedProduct(product) {
    const current = getCreatedProducts();
    saveCreatedProducts([...current, product]);
}

export function getDeletedProductIds() {
    return parseStoredArray(localStorage.getItem(DELETED_PRODUCT_IDS_KEY)).map((id) => String(id));
}

export function saveDeletedProductIds(ids) {
    localStorage.setItem(DELETED_PRODUCT_IDS_KEY, JSON.stringify(ids.map((id) => String(id))));
    dispatchStorageUpdate(DELETED_PRODUCT_IDS_KEY);
}

export function addDeletedProductId(id) {
    const normalizedId = String(id);
    const current = getDeletedProductIds();
    if (current.includes(normalizedId)) return current;
    const next = [...current, normalizedId];
    saveDeletedProductIds(next);
    return next;
}

export function removeDeletedProductId(id) {
    const normalizedId = String(id);
    const current = getDeletedProductIds();
    const next = current.filter((value) => value !== normalizedId);
    saveDeletedProductIds(next);
    return next;
}

export function subscribeToProductStorage(onChange) {
    const handleStorage = () => onChange();
    const handleLocalUpdate = () => onChange();
    window.addEventListener('storage', handleStorage);
    window.addEventListener(PRODUCT_STORAGE_EVENT, handleLocalUpdate);

    return () => {
        window.removeEventListener('storage', handleStorage);
        window.removeEventListener(PRODUCT_STORAGE_EVENT, handleLocalUpdate);
    };
}

export function getAllProducts(baseProducts) {
    const deletedIds = new Set(getDeletedProductIds());
    const createdProducts = getCreatedProducts();
    return [...(baseProducts || []), ...createdProducts].filter(
        (product) => !deletedIds.has(String(product?.id ?? product?.product_id))
    );
}
