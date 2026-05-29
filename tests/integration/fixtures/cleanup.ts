import { adminClient } from './supabase'

export interface CleanupCtx {
  taskIds: string[]
  whitelistIds: string[]
  leaveIds: string[]
}

export function makeCleanupCtx(): CleanupCtx {
  return { taskIds: [], whitelistIds: [], leaveIds: [] }
}

export async function cleanup(ctx: CleanupCtx) {
  if (ctx.taskIds.length > 0) {
    await adminClient.from('task_assignees').delete().in('task_id', ctx.taskIds)
    await adminClient.from('tasks').delete().in('id', ctx.taskIds)
  }
  if (ctx.whitelistIds.length > 0) {
    await adminClient.from('whitelist').delete().in('id', ctx.whitelistIds)
  }
  if (ctx.leaveIds.length > 0) {
    await adminClient.from('leaves').delete().in('id', ctx.leaveIds)
  }
}
