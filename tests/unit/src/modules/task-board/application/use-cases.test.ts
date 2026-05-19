import { describe, it, expect, vi } from 'vitest'
import { TaskUseCases, type UseCaseCaller } from '@/src/modules/task-board/application/use-cases'
import type { TaskRepository } from '@/src/modules/task-board/domain/repository'
import type { Task, TaskWithAssignees, NormalizedTaskInput } from '@/src/modules/task-board/domain/entities'

function makeRepo(overrides: Partial<TaskRepository> = {}): TaskRepository {
  return {
    createTask: vi.fn().mockResolvedValue({} as Task),
    getTaskById: vi.fn().mockResolvedValue(null),
    updateTask: vi.fn().mockResolvedValue(undefined),
    updateTaskStatus: vi.fn().mockResolvedValue(undefined),
    updateTaskAssignees: vi.fn().mockResolvedValue(undefined),
    archiveTask: vi.fn().mockResolvedValue(undefined),
    deleteTask: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

const admin: UseCaseCaller = { userId: 'u1', role: 'admin' }
const coord: UseCaseCaller = { userId: 'u2', role: 'coordenador' }
const efetivo: UseCaseCaller = { userId: 'u3', role: 'efetivo' }

const baseInput: NormalizedTaskInput = {
  title: 'Tarefa',
  description: null,
  start_date: '2026-05-01',
  end_date: '2026-05-31',
  sector: 'DT',
  drive_url: null,
  is_servico: false,
}

describe('TaskUseCases.createTask', () => {
  it('usuário autenticado cria tarefa', async () => {
    const repo = makeRepo()
    const uc = new TaskUseCases(repo)
    await uc.createTask(efetivo, baseInput, [])
    expect(repo.createTask).toHaveBeenCalledOnce()
  })

  it('sem assignees → status backlog', async () => {
    const repo = makeRepo()
    const uc = new TaskUseCases(repo)
    await uc.createTask(efetivo, baseInput, [])
    expect(repo.createTask).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'backlog' }),
      []
    )
  })

  it('com assignees → status alocada', async () => {
    const repo = makeRepo()
    const uc = new TaskUseCases(repo)
    await uc.createTask(efetivo, baseInput, ['uid-1'])
    expect(repo.createTask).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'alocada' }),
      ['uid-1']
    )
  })

  it('caller null → UNAUTHENTICATED', async () => {
    const uc = new TaskUseCases(makeRepo())
    await expect(uc.createTask(null, baseInput, [])).rejects.toThrow('UNAUTHENTICATED')
  })
})

describe('TaskUseCases.updateTaskStatus', () => {
  it.each(['backlog', 'alocada', 'em_desenvolvimento', 'em_revisao'] as const)(
    'efetivo pode mover para %s',
    async (status) => {
      const repo = makeRepo()
      const uc = new TaskUseCases(repo)
      await uc.updateTaskStatus(efetivo, 'task-1', status)
      expect(repo.updateTaskStatus).toHaveBeenCalledWith('task-1', status)
    }
  )

  it.each(['finalizada', 'arquivada'] as const)(
    'efetivo NÃO pode mover para %s',
    async (status) => {
      const uc = new TaskUseCases(makeRepo())
      await expect(uc.updateTaskStatus(efetivo, 'task-1', status)).rejects.toThrow('FORBIDDEN')
    }
  )

  it.each(['finalizada', 'arquivada'] as const)(
    'admin pode mover para %s',
    async (status) => {
      const repo = makeRepo()
      const uc = new TaskUseCases(repo)
      await uc.updateTaskStatus(admin, 'task-1', status)
      expect(repo.updateTaskStatus).toHaveBeenCalledWith('task-1', status)
    }
  )

  it.each(['finalizada', 'arquivada'] as const)(
    'coordenador pode mover para %s',
    async (status) => {
      const repo = makeRepo()
      const uc = new TaskUseCases(repo)
      await uc.updateTaskStatus(coord, 'task-1', status)
      expect(repo.updateTaskStatus).toHaveBeenCalledWith('task-1', status)
    }
  )

  it('caller null → UNAUTHENTICATED para status ativo', async () => {
    const uc = new TaskUseCases(makeRepo())
    await expect(uc.updateTaskStatus(null, 'task-1', 'em_revisao')).rejects.toThrow('UNAUTHENTICATED')
  })
})

describe('TaskUseCases.updateTask', () => {
  it('admin pode atualizar', async () => {
    const repo = makeRepo()
    const uc = new TaskUseCases(repo)
    await uc.updateTask(admin, 'task-1', baseInput, [])
    expect(repo.updateTask).toHaveBeenCalledOnce()
  })

  it('efetivo → FORBIDDEN', async () => {
    const uc = new TaskUseCases(makeRepo())
    await expect(uc.updateTask(efetivo, 'task-1', baseInput, [])).rejects.toThrow('FORBIDDEN')
  })
})

describe('TaskUseCases.updateTaskAssignees', () => {
  it('admin pode atualizar assignees', async () => {
    const repo = makeRepo()
    const uc = new TaskUseCases(repo)
    await uc.updateTaskAssignees(admin, 'task-1', [])
    expect(repo.updateTaskAssignees).toHaveBeenCalledOnce()
  })

  it('efetivo → FORBIDDEN', async () => {
    const uc = new TaskUseCases(makeRepo())
    await expect(uc.updateTaskAssignees(efetivo, 'task-1', [])).rejects.toThrow('FORBIDDEN')
  })

  it('tarefa em backlog com novo assignee → promove para alocada', async () => {
    const repo = makeRepo({
      getTaskById: vi.fn().mockResolvedValue({ status: 'backlog' } as TaskWithAssignees),
    })
    const uc = new TaskUseCases(repo)
    await uc.updateTaskAssignees(admin, 'task-1', ['uid-1'])
    expect(repo.updateTaskStatus).toHaveBeenCalledWith('task-1', 'alocada')
  })

  it('tarefa já alocada não muda status ao adicionar assignee', async () => {
    const repo = makeRepo({
      getTaskById: vi.fn().mockResolvedValue({ status: 'alocada' } as TaskWithAssignees),
    })
    const uc = new TaskUseCases(repo)
    await uc.updateTaskAssignees(admin, 'task-1', ['uid-1'])
    expect(repo.updateTaskStatus).not.toHaveBeenCalled()
  })
})

describe('TaskUseCases.archiveTask', () => {
  it('admin pode arquivar', async () => {
    const repo = makeRepo()
    const uc = new TaskUseCases(repo)
    await uc.archiveTask(admin, 'task-1')
    expect(repo.archiveTask).toHaveBeenCalledWith('task-1')
  })

  it('efetivo → FORBIDDEN', async () => {
    const uc = new TaskUseCases(makeRepo())
    await expect(uc.archiveTask(efetivo, 'task-1')).rejects.toThrow('FORBIDDEN')
  })
})

describe('TaskUseCases.deleteTask', () => {
  it('admin pode deletar', async () => {
    const repo = makeRepo()
    const uc = new TaskUseCases(repo)
    await uc.deleteTask(admin, 'task-1')
    expect(repo.deleteTask).toHaveBeenCalledWith('task-1')
  })

  it('efetivo → FORBIDDEN', async () => {
    const uc = new TaskUseCases(makeRepo())
    await expect(uc.deleteTask(efetivo, 'task-1')).rejects.toThrow('FORBIDDEN')
  })
})
