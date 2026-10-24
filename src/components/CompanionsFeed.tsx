'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  MessageCircle,
  Sparkles,
  Send,
  KeyRound,
  Edit3,
  Trash2,
  Check,
  X,
  SlidersHorizontal,
  BookOpen,
  RotateCcw,
  ChevronDown,
} from 'lucide-react';
import { SharingPost, Comment, SiteSettings, PursuitPlan } from '../types';

export interface DeletedCommentRecord {
  postId: string;
  comment: Comment;
  index: number;
}

interface CompanionsFeedProps {
  posts: SharingPost[];
  activePlanTitle?: string;
  activePlanId?: string;
  joinedPlans?: PursuitPlan[];
  currentUserId?: string;
  currentUserName: string;
  isAdmin?: boolean;
  onToggleAmen: (postId: string) => void;
  onAddComment: (postId: string, content: string) => void;
  onEditPost?: (postId: string, newReflection: string, newUnitTitle?: string) => void;
  onDeletePost?: (postId: string) => void;
  onEditComment?: (postId: string, commentId: string, newContent: string) => void;
  onDeleteComment?: (postId: string, commentId: string) => void;
  recentlyDeletedComment?: DeletedCommentRecord | null;
  onRestoreComment?: (record?: DeletedCommentRecord | null) => void;
  hasJoinedPlans?: boolean;
  onOpenJoinByCode?: () => void;
  siteSettings?: SiteSettings;
}

export const CompanionsFeed: React.FC<CompanionsFeedProps> = ({
  posts,
  activePlanTitle,
  activePlanId,
  joinedPlans = [],
  currentUserId,
  currentUserName,
  isAdmin = false,
  onToggleAmen,
  onAddComment,
  onEditPost,
  onDeletePost,
  onEditComment,
  onDeleteComment,
  recentlyDeletedComment,
  onRestoreComment,
  hasJoinedPlans = true,
  onOpenJoinByCode,
  siteSettings,
}) => {
  const canMutualAmen = siteSettings?.allowMutualAmens !== false;
  const canComment = siteSettings?.allowComments !== false;
  const canJoinByCode = siteSettings?.allowJoinByInviteCode !== false;
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  // Pursuit Plan selection state (defaults to activePlanId, allows selecting any joined plan or 'all')
  const [selectedPlanId, setSelectedPlanId] = useState<string>(activePlanId || 'all');

  // Sync default selection when current activePlanId changes
  useEffect(() => {
    if (activePlanId) {
      setSelectedPlanId(activePlanId);
    }
  }, [activePlanId]);

  // Filtering State: Author filter (all vs mine)
  const [authorFilter, setAuthorFilter] = useState<'all' | 'mine'>('all');

  // Inline post editing state (reflection text + unitTitle)
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingPostText, setEditingPostText] = useState('');
  const [editingPostUnitTitle, setEditingPostUnitTitle] = useState('');

  // Inline comment editing state
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');

  const isOwnPost = (post: SharingPost) => {
    if (currentUserId && post.authorId === currentUserId) return true;
    return post.authorName === currentUserName;
  };

  // Filtered Posts: filtered by chosen joined pursuit plan and author
  const filteredAndSortedPosts = useMemo(() => {
    let result = [...posts];

    // 1. Pursuit Plan Filter: default to activePlanId, or specific joined plan, or 'all'
    if (selectedPlanId && selectedPlanId !== 'all') {
      result = result.filter((p) => {
        if (p.planId) return p.planId === selectedPlanId;
        const targetPlan = joinedPlans?.find((jp) => jp.id === selectedPlanId);
        if (targetPlan) return p.planTitle === targetPlan.title;
        return p.planTitle === activePlanTitle;
      });
    }

    // 2. Author Filter
    if (authorFilter === 'mine') {
      result = result.filter((p) => isOwnPost(p));
    }

    return result;
  }, [posts, selectedPlanId, joinedPlans, activePlanTitle, authorFilter, currentUserId, currentUserName]);

  const selectedPlan = joinedPlans?.find((p) => p.id === selectedPlanId);
  const displayTitle = selectedPlanId === 'all'
    ? '全部已加入追求'
    : (selectedPlan?.title || activePlanTitle);

  const handleSendComment = (postId: string) => {
    if (!commentText.trim()) return;
    onAddComment(postId, commentText.trim());
    setCommentText('');
  };

  const handleStartEditPost = (post: SharingPost) => {
    const initialContent = post.keyVerse
      ? `${post.keyVerse}\n${post.reflection}`.trim()
      : post.reflection;
    setEditingPostId(post.id);
    setEditingPostText(initialContent);
    setEditingPostUnitTitle(post.unitTitle || '第 1 篇');
  };

  const handleSaveEditPost = (postId: string) => {
    if (!editingPostText.trim()) return;
    onEditPost?.(postId, editingPostText.trim(), editingPostUnitTitle.trim());
    setEditingPostId(null);
    setEditingPostText('');
    setEditingPostUnitTitle('');
  };

  const handleStartEditComment = (commentId: string, currentContent: string) => {
    setEditingCommentId(commentId);
    setEditingCommentText(currentContent);
  };

  const handleSaveEditComment = (postId: string, commentId: string) => {
    if (!editingCommentText.trim()) return;
    onEditComment?.(postId, commentId, editingCommentText.trim());
    setEditingCommentId(null);
    setEditingCommentText('');
  };

  const handleDeletePostClick = (postId: string) => {
    if (activeCommentPostId === postId) {
      setActiveCommentPostId(null);
    }
    if (editingPostId === postId) {
      setEditingPostId(null);
      setEditingPostText('');
      setEditingPostUnitTitle('');
    }
    onDeletePost?.(postId);
  };

  return (
    <div className="space-y-4">
      {/* Header & Filter / Sort Controls */}
      <div className="space-y-3 pb-2 border-b border-stone-200/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2 flex-wrap">
              <span>同伴追求動態牆</span>
              {displayTitle && (
                <span
                  className="text-xs bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 font-bold px-2.5 py-0.5 rounded-full border border-amber-300 dark:border-amber-700 shadow-2xs max-w-[240px] truncate"
                  title={displayTitle}
                >
                  {displayTitle.replace(/^主題：/, '')}
                </span>
              )}
              <span className="text-xs bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-medium px-2 py-0.5 rounded-full">
                {hasJoinedPlans ? filteredAndSortedPosts.length : 0} 則分享
              </span>
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {selectedPlanId === 'all'
                ? '展示您已加入之全部追求主題內同伴每日晨興與追求的摸著與亮光，彼此激勵、同聲阿們'
                : displayTitle
                ? `動態牆展示主題【${displayTitle.replace(/^主題：/, '')}】，展示此主題內同伴每日晨興與追求的摸著與亮光`
                : '展示追求主題內同伴每日晨興與追求的亮光點滴，彼此激勵、同聲阿們'}
            </p>
          </div>
        </div>

        {/* Pursuit Selector & Author Filter */}
        {hasJoinedPlans && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1 flex-wrap">
            {/* Joined Pursuit Selector (Allows saint to freely pick among joined plans, defaults to activePlanId) */}
            {joinedPlans && joinedPlans.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-stone-400 flex items-center gap-1 text-[11px] whitespace-nowrap font-medium">
                  <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                  追求主題：
                </span>
                <div className="relative inline-block">
                  <select
                    value={selectedPlanId}
                    onChange={(e) => setSelectedPlanId(e.target.value)}
                    className="appearance-none text-xs font-semibold bg-amber-50/90 dark:bg-stone-800 text-amber-900 dark:text-amber-200 pl-2.5 pr-7 py-1 rounded-xl border border-amber-300 dark:border-stone-700 hover:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-500 max-w-[240px] sm:max-w-[300px] truncate shadow-2xs cursor-pointer"
                    title="自由選擇已加入的追求主題（預設為當前追求）"
                  >
                    {/* Active Plan First (Default) */}
                    {activePlanId && (
                      <option value={activePlanId}>
                        🎯 當前：{joinedPlans.find((p) => p.id === activePlanId)?.title || activePlanTitle || '當前追求'}
                      </option>
                    )}
                    {/* Other joined plans */}
                    {joinedPlans
                      .filter((p) => p.id !== activePlanId)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          📖 {p.title}
                        </option>
                      ))}
                    {/* Option to show all joined plans */}
                    {joinedPlans.length > 1 && (
                      <option value="all">
                        🌟 全部已加入主題 ({joinedPlans.length})
                      </option>
                    )}
                  </select>
                  <ChevronDown className="w-3 h-3 text-amber-700 dark:text-amber-300 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Author Filter: All vs Mine */}
            {posts.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-stone-400 flex items-center gap-1 text-[11px] whitespace-nowrap">
                  <SlidersHorizontal className="w-3 h-3" />
                  對象：
                </span>
                <button
                  type="button"
                  onClick={() => setAuthorFilter('all')}
                  className={`px-2.5 py-1 rounded-xl whitespace-nowrap border transition-all text-xs ${
                    authorFilter === 'all'
                      ? 'bg-stone-900 text-white border-stone-900 font-medium shadow-2xs'
                      : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-stone-300'
                  }`}
                >
                  全部同伴
                </button>
                <button
                  type="button"
                  onClick={() => setAuthorFilter('mine')}
                  className={`px-2.5 py-1 rounded-xl whitespace-nowrap border transition-all text-xs ${
                    authorFilter === 'mine'
                      ? 'bg-amber-600 text-white border-amber-600 font-medium shadow-2xs'
                      : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-amber-300'
                  }`}
                >
                  只看自己
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Feed list */}
      {!hasJoinedPlans ? (
        <div className="text-center py-12 px-6 bg-white rounded-3xl border border-dashed border-stone-200 text-stone-500">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl">
            🌱
          </div>
          <p className="text-sm font-bold text-stone-800">尚未加入追求主題</p>
          <p className="text-xs text-stone-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
            {isAdmin
              ? '同伴追求動態牆僅顯示您所參與之追求主題內的分享。您身為管理員，可於上方開啟或選擇追求主題，即可與同伴彼此激勵、同聲阿們！'
              : '同伴追求動態牆僅顯示您所參與之追求主題內的分享。請先輸入 6-Emoji 邀請碼加入主題小組，即可與同伴彼此激勵、同聲阿們！'}
          </p>
          {onOpenJoinByCode && !isAdmin && canJoinByCode && (
            <button
              onClick={onOpenJoinByCode}
              className="mt-4 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>輸入 6-Emoji 邀請碼加入</span>
            </button>
          )}
        </div>
      ) : filteredAndSortedPosts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-stone-200 text-stone-400">
          <Sparkles className="w-8 h-8 mx-auto mb-2 text-stone-300" />
          <p className="text-sm font-medium">
            {posts.length === 0
              ? `【${activePlanTitle ? activePlanTitle.replace(/^主題：/, '') : '當前主題'}】尚無同伴動態`
              : '此篩選條件下尚無分享'}
          </p>
          <p className="text-xs mt-1">
            {posts.length === 0
              ? '快來成為今天第一個分享摸著的同伴吧！在上方點擊「分享今日摸著與亮光」即可發布。'
              : '可切換為「全部同伴」查看此主題的分享。'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedPosts.map((post) => {
            const ownPost = isOwnPost(post);
            const isEditingThisPost = editingPostId === post.id;

            return (
              <div
                key={post.id}
                className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs hover:border-amber-200 transition-all"
              >
                {/* Author Info */}
                <div className="flex items-start justify-between mb-3 gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-lg shadow-inner">
                      {post.authorAvatar}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-stone-900">
                          {post.authorName}
                        </span>
                        <span className="text-[11px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded-md font-medium">
                          同伴
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-400">
                        {post.createdAt} · 追求：{post.planTitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    <span className="text-xs text-amber-800 font-medium bg-amber-50 px-2 py-0.5 rounded-md">
                      {post.unitTitle}
                    </span>

                    {/* Edit & Delete buttons: Author can edit/delete; Admin can delete any post */}
                    {!isEditingThisPost && (
                      <div className="flex items-center gap-1">
                        {ownPost && onEditPost && (
                          <button
                            type="button"
                            onClick={() => handleStartEditPost(post)}
                            className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-stone-100 hover:bg-amber-50 text-stone-600 hover:text-amber-800 flex items-center gap-1 transition-colors"
                            title="修改這則分享與篇數"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>修改</span>
                          </button>
                        )}
                        {(ownPost || isAdmin) && onDeletePost && (
                          <button
                            type="button"
                            onClick={() => handleDeletePostClick(post.id)}
                            className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-stone-100 hover:bg-rose-50 text-stone-600 hover:text-rose-700 flex items-center gap-1 transition-colors"
                            title={isAdmin && !ownPost ? "管理員刪除此分享" : "刪除這則分享"}
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>{isAdmin && !ownPost ? "管理員刪除" : "刪除"}</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Content or Inline Editor */}
                {isEditingThisPost ? (
                  <div className="my-3 space-y-2.5 bg-amber-50/40 p-3.5 rounded-xl border border-amber-200/80">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-semibold text-amber-900 flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                        <span>篇數（分享錯篇可改）：</span>
                      </label>
                      <input
                        type="text"
                        value={editingPostUnitTitle}
                        onChange={(e) => setEditingPostUnitTitle(e.target.value)}
                        placeholder="例如：第 2 篇"
                        className="text-xs rounded-lg border border-amber-300 bg-white px-2 py-1 text-stone-800 w-32 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <textarea
                      value={editingPostText}
                      onChange={(e) => setEditingPostText(e.target.value)}
                      rows={4}
                      className="w-full text-sm rounded-xl border border-stone-200 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 leading-relaxed"
                      placeholder="修改您的今日摸著與亮光..."
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPostId(null);
                          setEditingPostText('');
                          setEditingPostUnitTitle('');
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-stone-600 hover:bg-stone-100 flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>取消</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEditPost(post.id)}
                        disabled={!editingPostText.trim()}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white flex items-center gap-1 shadow-2xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>儲存修改</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Key Scripture Quote (if present in existing post) */}
                    {post.keyVerse && (
                      <div className="my-3 scripture-quote bg-amber-50/40 rounded-r-xl py-2 px-3 text-xs sm:text-sm font-serif text-stone-800 leading-relaxed">
                        {post.keyVerse}
                      </div>
                    )}

                    {/* Reflection Body */}
                    <p className="text-sm text-stone-700 leading-relaxed mb-3 whitespace-pre-line">
                      {post.reflection}
                    </p>
                  </>
                )}

                {/* Action Bar (Amen, Comment) */}
                {(canMutualAmen || canComment || (post.comments?.length || 0) > 0) && (() => {
                  const isReactedAmen = (post.reactions?.amenUserIds || []).includes(currentUserId || '');

                  return (
                    <div className="flex items-center justify-between pt-3 border-t border-stone-100 text-xs">
                      <div className="flex items-center gap-2">
                        {/* Amen button - per-user independent reaction */}
                        {canMutualAmen && (
                          <button
                            onClick={() => onToggleAmen(post.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all ${
                              isReactedAmen
                                ? 'bg-amber-100 text-amber-800 font-semibold'
                                : 'text-stone-600 hover:bg-amber-50 hover:text-amber-700'
                            }`}
                          >
                            <Sparkles
                              className={`w-4 h-4 ${
                                isReactedAmen
                                  ? 'text-amber-600 fill-amber-500'
                                  : 'text-stone-400'
                              }`}
                            />
                            <span>阿們 ({post.reactions?.amenCount || 0})</span>
                          </button>
                        )}

                        {/* Comment Toggle */}
                        {(canComment || (post.comments?.length || 0) > 0) && (
                          <button
                            onClick={() =>
                              setActiveCommentPostId(
                                activeCommentPostId === post.id ? null : post.id
                              )
                            }
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium text-stone-600 hover:bg-stone-100 transition-colors"
                          >
                            <MessageCircle className="w-4 h-4 text-stone-400" />
                            <span>留言 ({post.comments?.length || 0})</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Comment Section */}
                {activeCommentPostId === post.id && (
                  <div className="mt-4 pt-3 border-t border-stone-100 space-y-3 animate-in fade-in duration-150">
                    {/* Comment input */}
                    {canComment && (
                      <div className="flex items-end gap-2">
                        <textarea
                          rows={2}
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                              e.preventDefault();
                              handleSendComment(post.id);
                            }
                          }}
                          placeholder="寫下留言與同伴互勉...（可直接按 Enter 換行）"
                          className="flex-1 text-xs rounded-xl border border-stone-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-y min-h-[46px] leading-relaxed"
                        />
                        <button
                          onClick={() => handleSendComment(post.id)}
                          disabled={!commentText.trim()}
                          className="px-3 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl transition-colors shadow-2xs flex items-center gap-1 text-xs font-semibold self-stretch sm:self-auto justify-center"
                          title="送出留言（亦可使用 Ctrl+Enter / Cmd+Enter）"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">送出</span>
                        </button>
                      </div>
                    )}

                    {/* Comments list */}
                    {(post.comments?.length || 0) > 0 && (
                      <div className="space-y-2 pt-1">
                        {(post.comments || []).map((comment) => {
                          const isOwnComment = comment.authorName === currentUserName;
                          const isEditingThisComment = editingCommentId === comment.id;

                          return (
                            <div
                              key={comment.id}
                              className="bg-stone-50/80 rounded-xl p-2.5 text-xs flex items-start gap-2 border border-stone-100"
                            >
                              <span className="text-sm mt-0.5">{comment.authorAvatar}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1 mb-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-semibold text-stone-800">
                                      {comment.authorName}
                                    </span>
                                    <span className="text-[10px] text-stone-400">
                                      {comment.timestamp}
                                    </span>
                                  </div>

                                  {/* Edit & Delete: Author can edit/delete; Admin can delete any comment */}
                                  {!isEditingThisComment && (
                                    <div className="flex items-center gap-1">
                                      {isOwnComment && onEditComment && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleStartEditComment(comment.id, comment.content)
                                          }
                                          className="text-[10px] text-stone-400 hover:text-amber-800 p-0.5"
                                          title="修改留言"
                                        >
                                          <Edit3 className="w-2.5 h-2.5" />
                                        </button>
                                      )}
                                      {(isOwnComment || isAdmin) && onDeleteComment && (
                                        <button
                                          type="button"
                                          onClick={() => onDeleteComment(post.id, comment.id)}
                                          className="text-[10px] text-stone-400 hover:text-rose-600 p-0.5"
                                          title={isAdmin && !isOwnComment ? "管理員刪除留言" : "刪除留言"}
                                        >
                                          <Trash2 className="w-2.5 h-2.5" />
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {isEditingThisComment ? (
                                  <div className="mt-1 space-y-1.5">
                                    <textarea
                                      rows={2}
                                      value={editingCommentText}
                                      onChange={(e) => setEditingCommentText(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                          e.preventDefault();
                                          handleSaveEditComment(post.id, comment.id);
                                        }
                                      }}
                                      className="w-full text-xs rounded-lg border border-amber-300 bg-white px-2.5 py-1.5 focus:outline-none resize-y min-h-[40px] leading-relaxed"
                                    />
                                    <div className="flex items-center gap-1.5 justify-end">
                                      <button
                                        type="button"
                                        onClick={() => handleSaveEditComment(post.id, comment.id)}
                                        className="px-2.5 py-1 bg-amber-500 text-white text-[11px] font-semibold rounded-lg hover:bg-amber-600 flex items-center gap-1"
                                      >
                                        <Check className="w-3 h-3" />
                                        <span>儲存</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingCommentId(null);
                                          setEditingCommentText('');
                                        }}
                                        className="px-2.5 py-1 text-stone-500 hover:text-stone-700 text-[11px] rounded-lg hover:bg-stone-100 flex items-center gap-1"
                                      >
                                        <X className="w-3 h-3" />
                                        <span>取消</span>
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-stone-700 leading-relaxed break-words whitespace-pre-wrap">
                                    {comment.content}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
