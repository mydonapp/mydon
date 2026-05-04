import { ref } from 'vue';
import { useAuth } from '../useAuth';
import { useConstant } from '../useConstant';

export interface Category {
  id: string;
  name: string;
}

export const useCategories = () => {
  const { getAccessToken } = useAuth();
  const { URI } = useConstant();

  const categories = ref<Category[]>([]);
  const loading = ref(false);

  const fetchCategories = async () => {
    loading.value = true;
    try {
      const res = await fetch(`${URI.API}/v1/categories`, {
        headers: { Authorization: `Bearer ${getAccessToken()}` },
      });
      categories.value = await res.json();
    } finally {
      loading.value = false;
    }
  };

  const createCategory = async (name: string): Promise<Category> => {
    const res = await fetch(`${URI.API}/v1/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAccessToken()}`,
      },
      body: JSON.stringify({ name }),
    });
    const category = await res.json();
    categories.value = [...categories.value, category].sort((a, b) =>
      a.name.localeCompare(b.name),
    );
    return category;
  };

  const updateCategory = async (id: string, name: string): Promise<Category> => {
    const res = await fetch(`${URI.API}/v1/categories/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAccessToken()}`,
      },
      body: JSON.stringify({ name }),
    });
    const updated = await res.json();
    const idx = categories.value.findIndex((c) => c.id === id);
    if (idx !== -1) {
      categories.value = [
        ...categories.value.slice(0, idx),
        updated,
        ...categories.value.slice(idx + 1),
      ].sort((a, b) => a.name.localeCompare(b.name));
    }
    return updated;
  };

  fetchCategories();

  return { categories, loading, fetchCategories, createCategory, updateCategory };
};
