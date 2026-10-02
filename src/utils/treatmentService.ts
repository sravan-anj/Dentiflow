import { TreatmentCatalogueItem } from '../types';
import { StorageService } from './storage';
import { INITIAL_TREATMENT_CATALOGUE } from '../data/seedData';
import { supabase } from './supabaseClient';

export interface CreateTreatmentInput {
  name: string;
  price: number;
  category?: string;
  description?: string;
  code?: string;
}

export interface UpdateTreatmentInput {
  name?: string;
  price?: number;
  category?: string;
  description?: string;
  code?: string;
}

/**
 * Format currency amount in Indian Rupee standard format (e.g. ₹4,500, ₹1,50,000).
 */
export function formatIndianRupees(amount: number): string {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  } catch (e) {
    return `₹${amount.toLocaleString('en-IN')}`;
  }
}

/**
 * Centralized Service for the clinic's Master Treatment Catalogue.
 * Provides clean CRUD operations backed by local persistent storage and Supabase PostgreSQL.
 */
class TreatmentCatalogueService {
  /**
   * Read / List all available master treatments.
   */
  public async getTreatments(): Promise<TreatmentCatalogueItem[]> {
    try {
      // First attempt to read from Supabase if online
      const { data, error } = await supabase
        .from('treatment_catalogue')
        .select('*')
        .order('price', { ascending: true });

      if (!error && data && data.length > 0) {
        const items: TreatmentCatalogueItem[] = data.map((row: any) => ({
          id: row.id,
          name: row.name,
          price: Number(row.price),
          category: row.category || 'General',
          description: row.description || '',
          code: row.code || '',
          createdAt: row.created_at,
          updatedAt: row.updated_at
        }));
        // Update local cache
        StorageService.saveTreatmentCatalogue(items);
        return items;
      }
    } catch (err) {
      console.warn('Supabase fetch failed, falling back to local storage cache:', err);
    }

    // LocalStorage fallback
    const cached = StorageService.getTreatmentCatalogue();
    if (cached && cached.length > 0) {
      return cached;
    }

    return INITIAL_TREATMENT_CATALOGUE;
  }

  /**
   * Synchronously return treatment catalogue from localStorage cache.
   */
  public getTreatmentsSync(): TreatmentCatalogueItem[] {
    const cached = StorageService.getTreatmentCatalogue();
    if (cached && cached.length > 0) {
      return cached;
    }
    return INITIAL_TREATMENT_CATALOGUE;
  }

  /**
   * Create a new treatment item in the catalogue.
   */
  public async createTreatment(input: CreateTreatmentInput): Promise<TreatmentCatalogueItem> {
    const trimmedName = input.name.trim();
    if (!trimmedName) {
      throw new Error('Treatment name is required.');
    }
    if (typeof input.price !== 'number' || isNaN(input.price) || input.price < 0) {
      throw new Error('Valid treatment price is required.');
    }

    const currentList = await this.getTreatments();

    const newItem: TreatmentCatalogueItem = {
      id: `treat-${Date.now()}`,
      name: trimmedName,
      price: Math.round(input.price),
      category: input.category?.trim() || 'General Dentistry',
      description: input.description?.trim() || '',
      code: input.code?.trim() || `TR-${Math.floor(100 + Math.random() * 900)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updated = [newItem, ...currentList];
    StorageService.saveTreatmentCatalogue(updated);

    try {
      await supabase.from('treatment_catalogue').insert({
        id: newItem.id,
        name: newItem.name,
        price: newItem.price,
        category: newItem.category,
        description: newItem.description,
        code: newItem.code,
        created_at: newItem.createdAt,
        updated_at: newItem.updatedAt
      });
    } catch (err) {
      console.warn('Failed to insert into Supabase treatment_catalogue:', err);
    }

    return newItem;
  }

  /**
   * Update an existing treatment item.
   */
  public async updateTreatment(id: string, input: UpdateTreatmentInput): Promise<TreatmentCatalogueItem> {
    const currentList = await this.getTreatments();
    const existingIndex = currentList.findIndex(t => t.id === id);

    if (existingIndex === -1) {
      throw new Error(`Treatment with ID "${id}" was not found.`);
    }

    const existing = currentList[existingIndex];
    const updatedItem: TreatmentCatalogueItem = {
      ...existing,
      name: input.name !== undefined ? input.name.trim() : existing.name,
      price: input.price !== undefined ? Math.round(input.price) : existing.price,
      category: input.category !== undefined ? input.category.trim() : existing.category,
      description: input.description !== undefined ? input.description.trim() : existing.description,
      code: input.code !== undefined ? input.code.trim() : existing.code,
      updatedAt: new Date().toISOString()
    };

    const updatedList = [...currentList];
    updatedList[existingIndex] = updatedItem;
    StorageService.saveTreatmentCatalogue(updatedList);

    try {
      await supabase
        .from('treatment_catalogue')
        .update({
          name: updatedItem.name,
          price: updatedItem.price,
          category: updatedItem.category,
          description: updatedItem.description,
          code: updatedItem.code,
          updated_at: updatedItem.updatedAt
        })
        .eq('id', id);
    } catch (err) {
      console.warn('Failed to update Supabase treatment_catalogue:', err);
    }

    return updatedItem;
  }

  /**
   * Delete a treatment item from the catalogue.
   */
  public async deleteTreatment(id: string): Promise<boolean> {
    const currentList = await this.getTreatments();
    const filtered = currentList.filter(t => t.id !== id);

    if (filtered.length === currentList.length) {
      return false;
    }

    StorageService.saveTreatmentCatalogue(filtered);

    try {
      await supabase.from('treatment_catalogue').delete().eq('id', id);
    } catch (err) {
      console.warn('Failed to delete from Supabase treatment_catalogue:', err);
    }

    return true;
  }

  /**
   * Reset catalogue to initial mock defaults (useful for demonstrations).
   */
  public async resetToDefaults(): Promise<TreatmentCatalogueItem[]> {
    StorageService.saveTreatmentCatalogue(INITIAL_TREATMENT_CATALOGUE);
    try {
      const rows = INITIAL_TREATMENT_CATALOGUE.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        category: item.category,
        description: item.description,
        code: item.code,
        updated_at: new Date().toISOString()
      }));
      await supabase.from('treatment_catalogue').upsert(rows);
    } catch (err) {
      console.warn('Supabase reset upsert error:', err);
    }
    return INITIAL_TREATMENT_CATALOGUE;
  }

  /**
   * Get the standard baseline consultation fee.
   */
  public getConsultationFee(): number {
    return StorageService.getConsultationFee();
  }

  /**
   * Update the standard consultation fee.
   */
  public saveConsultationFee(fee: number): number {
    const validFee = Math.max(0, Math.round(fee));
    StorageService.saveConsultationFee(validFee);
    return validFee;
  }
}

export const treatmentService = new TreatmentCatalogueService();
