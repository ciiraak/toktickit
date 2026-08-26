const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
export async function checkSystem() {
    const healthRes = await fetch(`${API_URL}/api/health`);
    if (!healthRes.ok)
        throw new Error("Health check failed");
    const categoriesRes = await fetch(`${API_URL}/api/categories`);
    if (!categoriesRes.ok)
        throw new Error("Failed to fetch categories");
    const categories = await categoriesRes.json();
    return { online: true, categories };
}
export async function fetchRequesters() {
    const res = await fetch(`${API_URL}/api/requesters`);
    if (!res.ok) {
        throw new Error("Failed to fetch active development requesters");
    }
    return res.json();
}
export async function fetchCategories() {
    const res = await fetch(`${API_URL}/api/categories`);
    if (!res.ok) {
        throw new Error("Failed to fetch categories");
    }
    return res.json();
}
export async function fetchSystems() {
    const res = await fetch(`${API_URL}/api/systems`);
    if (!res.ok) {
        throw new Error("Failed to fetch related systems");
    }
    return res.json();
}
