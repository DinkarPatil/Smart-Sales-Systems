'use server';

import { revalidatePath } from 'next/cache';
import { api } from '@/lib/api';
import { ApiError } from '@/lib/api/http';
import type {
  CompanyCreate,
  CompanyUpdate,
  UserCompanyAssignmentCreate,
  UserCompanyAssignmentUpdate,
  UserCreate,
  UserUpdate,
} from '@/lib/api/schemas';

type Result<T> = { ok: true; data: T } | { ok: false; code: string; message: string };

function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

function fail(err: unknown): Result<never> {
  if (err instanceof ApiError) {
    return { ok: false, code: err.code, message: err.message };
  }
  return { ok: false, code: 'UNKNOWN', message: 'Something went wrong.' };
}

// --- Users ----------------------------------------------------------------
export async function provisionUser(body: UserCreate) {
  try {
    const data = await api.admin.users.create(body);
    revalidatePath('/admin/users');
    revalidatePath('/admin');
    return ok(data);
  } catch (err) {
    return fail(err);
  }
}

export async function updateUser(id: string, body: UserUpdate) {
  try {
    const data = await api.admin.users.update(id, body);
    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${id}`);
    return ok(data);
  } catch (err) {
    return fail(err);
  }
}

export async function deleteUser(id: string) {
  try {
    await api.admin.users.remove(id);
    revalidatePath('/admin/users');
    revalidatePath('/admin');
    return ok(null);
  } catch (err) {
    return fail(err);
  }
}

// --- Companies ------------------------------------------------------------
export async function createCompany(body: CompanyCreate) {
  try {
    const data = await api.admin.companies.create(body);
    revalidatePath('/admin/companies');
    revalidatePath('/admin');
    return ok(data);
  } catch (err) {
    return fail(err);
  }
}

export async function updateCompany(id: string, body: CompanyUpdate) {
  try {
    const data = await api.admin.companies.update(id, body);
    revalidatePath('/admin/companies');
    revalidatePath(`/admin/companies/${id}`);
    return ok(data);
  } catch (err) {
    return fail(err);
  }
}

export async function deleteCompany(id: string) {
  try {
    await api.admin.companies.remove(id);
    revalidatePath('/admin/companies');
    revalidatePath('/admin');
    return ok(null);
  } catch (err) {
    return fail(err);
  }
}

export async function reindexCompany(id: string) {
  try {
    const data = await api.admin.companies.reindex(id);
    revalidatePath('/admin/system/diagnostics');
    return ok(data);
  } catch (err) {
    return fail(err);
  }
}

// --- Assignments ----------------------------------------------------------
export async function createAssignment(uid: string, body: UserCompanyAssignmentCreate) {
  try {
    const data = await api.admin.users.assignments.create(uid, body);
    revalidatePath('/admin/assignments');
    revalidatePath(`/admin/users/${uid}`);
    return ok(data);
  } catch (err) {
    return fail(err);
  }
}

export async function updateAssignment(id: string, body: UserCompanyAssignmentUpdate) {
  try {
    const data = await api.admin.assignments.update(id, body);
    revalidatePath('/admin/assignments');
    return ok(data);
  } catch (err) {
    return fail(err);
  }
}

export async function deleteAssignment(id: string) {
  try {
    await api.admin.assignments.remove(id);
    revalidatePath('/admin/assignments');
    return ok(null);
  } catch (err) {
    return fail(err);
  }
}
