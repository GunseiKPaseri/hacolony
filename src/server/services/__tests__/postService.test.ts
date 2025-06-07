import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PostService, type CreatePostInput } from '../postService'
import { InvalidInputError } from '../../repository/util'
import type { PostRepository } from '../../repository/interface'
import { BotReplyService } from '../botReplyService'
import type { Post } from '@/generated/client'

describe('PostService', () => {
  let postService: PostService
  let mockPostRepository: PostRepository
  let mockBotReplyService: BotReplyService

  beforeEach(() => {
    mockPostRepository = {
      getPostsByUserId: vi.fn(),
      createPostByUserId: vi.fn(),
      createPostByAvatarId: vi.fn(),
      getPostById: vi.fn(),
    }

    mockBotReplyService = {
      triggerBotReplies: vi.fn(),
      triggerRandomBotPosts: vi.fn(),
    } as any

    postService = new PostService(mockPostRepository, mockBotReplyService)

    // console.logをモック
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe('getPostsByUserId', () => {
    it('should get posts by user id', async () => {
      const mockPosts: Post[] = [
        { id: '1', content: 'テスト投稿1', postedById: 'user1', replyToId: null, quotedPostId: null, createdAt: new Date(), updatedAt: new Date() },
        { id: '2', content: 'テスト投稿2', postedById: 'user1', replyToId: null, quotedPostId: null, createdAt: new Date(), updatedAt: new Date() }
      ]
      ;(mockPostRepository.getPostsByUserId as any).mockResolvedValue(mockPosts)

      const result = await postService.getPostsByUserId('user1')

      expect(result).toBe(mockPosts)
      expect(mockPostRepository.getPostsByUserId).toHaveBeenCalledWith('user1')
    })

    it('should throw error when userId is empty', async () => {
      await expect(postService.getPostsByUserId('')).rejects.toThrow(InvalidInputError)
    })

    it('should throw error when userId is only whitespace', async () => {
      await expect(postService.getPostsByUserId('   ')).rejects.toThrow(InvalidInputError)
    })
  })

  describe('createPost', () => {
    const validInput: CreatePostInput = {
      content: 'テスト投稿です',
      postedByUserId: 'user1'
    }

    const mockCreatedPost: Post = {
      id: 'post1',
      content: 'テスト投稿です',
      postedById: 'user1',
      replyToId: null,
      quotedPostId: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    it('should create post with valid input', async () => {
      ;(mockPostRepository.createPostByUserId as any).mockResolvedValue(mockCreatedPost)
      ;(mockBotReplyService.triggerBotReplies as any).mockResolvedValue()

      const result = await postService.createPost(validInput)

      expect(result).toBe(mockCreatedPost)
      expect(mockPostRepository.createPostByUserId).toHaveBeenCalledWith({
        content: 'テスト投稿です',
        postedByUserId: 'user1',
        replyToId: null
      })
    })

    it('should trim content and set replyToId to null when not provided', async () => {
      const input = {
        content: '  テスト投稿です  ',
        postedByUserId: 'user1'
      }
      ;(mockPostRepository.createPostByUserId as any).mockResolvedValue(mockCreatedPost)
      ;(mockBotReplyService.triggerBotReplies as any).mockResolvedValue()

      await postService.createPost(input)

      expect(mockPostRepository.createPostByUserId).toHaveBeenCalledWith({
        content: 'テスト投稿です',
        postedByUserId: 'user1',
        replyToId: null
      })
    })

    it('should handle replyToId when provided', async () => {
      const input = {
        ...validInput,
        replyToId: 'reply1'
      }
      const mockReplyPost = { ...mockCreatedPost, replyToId: 'reply1' }
      ;(mockPostRepository.createPostByUserId as any).mockResolvedValue(mockReplyPost)
      ;(mockBotReplyService.triggerBotReplies as any).mockResolvedValue()

      await postService.createPost(input)

      expect(mockPostRepository.createPostByUserId).toHaveBeenCalledWith({
        content: 'テスト投稿です',
        postedByUserId: 'user1',
        replyToId: 'reply1'
      })
    })

    it('should trigger bot replies in background', async () => {
      ;(mockPostRepository.createPostByUserId as any).mockResolvedValue(mockCreatedPost)
      ;(mockBotReplyService.triggerBotReplies as any).mockResolvedValue()

      await postService.createPost(validInput)

      expect(mockBotReplyService.triggerBotReplies).toHaveBeenCalledWith('post1', 'user1')
    })

    it('should throw error when content is empty', async () => {
      const input = { ...validInput, content: '' }
      await expect(postService.createPost(input)).rejects.toThrow(InvalidInputError)
    })

    it('should throw error when content is only whitespace', async () => {
      const input = { ...validInput, content: '   ' }
      await expect(postService.createPost(input)).rejects.toThrow(InvalidInputError)
    })

    it('should throw error when postedByUserId is empty', async () => {
      const input = { ...validInput, postedByUserId: '' }
      await expect(postService.createPost(input)).rejects.toThrow(InvalidInputError)
    })

    it('should throw error when content exceeds 280 characters', async () => {
      const longContent = 'a'.repeat(281)
      const input = { ...validInput, content: longContent }
      await expect(postService.createPost(input)).rejects.toThrow(InvalidInputError)
    })

    it('should handle bot reply trigger failure silently', async () => {
      ;(mockPostRepository.createPostByUserId as any).mockResolvedValue(mockCreatedPost)
      ;(mockBotReplyService.triggerBotReplies as any).mockRejectedValue(new Error('Bot error'))

      const result = await postService.createPost(validInput)

      expect(result).toBe(mockCreatedPost)
      expect(console.error).toHaveBeenCalledWith('Background bot reply trigger failed:', expect.any(Error))
    })
  })
})