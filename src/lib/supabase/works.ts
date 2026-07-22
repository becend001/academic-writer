import { supabase } from "./client";

export interface SavedWork {
  id?: string;
  user_id?: string;
  title: string;
  content: string;
  result?: string;
  feature: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * 保存工作记录
 */
export async function saveWork(work: SavedWork) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("请先登录");
  }

  const { data, error } = await supabase
    .from("saved_works")
    .insert({
      user_id: user.id,
      title: work.title,
      content: work.content,
      result: work.result,
      feature: work.feature,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * 更新工作记录
 */
export async function updateWork(id: string, work: Partial<SavedWork>) {
  const { data, error } = await supabase
    .from("saved_works")
    .update({
      ...work,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * 获取用户的所有工作记录
 */
export async function getWorks(limit = 20) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("请先登录");
  }

  const { data, error } = await supabase
    .from("saved_works")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * 获取单个工作记录
 */
export async function getWork(id: string) {
  const { data, error } = await supabase
    .from("saved_works")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * 删除工作记录
 */
export async function deleteWork(id: string) {
  const { error } = await supabase.from("saved_works").delete().eq("id", id);

  if (error) {
    throw error;
  }

  return true;
}
