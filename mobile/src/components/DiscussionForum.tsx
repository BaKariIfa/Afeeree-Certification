import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { MessageCircle, Send, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '@/lib/theme';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL ?? '';

export interface DiscussionReply {
  id: string;
  authorName: string;
  isAdmin: boolean;
  text: string;
  postedAt: string;
}

export interface DiscussionPost {
  id: string;
  moduleId: string;
  lessonIndex: number;
  participantCode: string;
  participantName: string;
  question: string;
  postedAt: string;
  replies: DiscussionReply[];
}

interface Props {
  moduleId: string;
  lessonIndex: number;
  participantCode: string;
  participantName: string;
  isAdmin?: boolean;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return 'just now';
}

function initials(name: string): string {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function DiscussionForum({ moduleId, lessonIndex, participantCode, participantName, isAdmin = false }: Props) {
  const [posts, setPosts] = useState<DiscussionPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [questionText, setQuestionText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
  const [showInput, setShowInput] = useState(false);

  const hasPosted = posts.some((p) => p.participantCode === participantCode);

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/discussions?moduleId=${moduleId}&lessonIndex=${lessonIndex}`
      );
      if (res.ok) setPosts(await res.json());
    } catch {}
    setLoading(false);
  }, [moduleId, lessonIndex]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const submitQuestion = async () => {
    if (!questionText.trim() || submitting) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSubmitting(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/discussions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId, lessonIndex, participantCode, participantName: participantName, question: questionText.trim() }),
      });
      if (res.ok) {
        const post = await res.json() as DiscussionPost;
        setPosts((prev) => [...prev, post]);
        setQuestionText('');
        setShowInput(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {}
    setSubmitting(false);
  };

  const submitReply = async (postId: string) => {
    const text = replyTexts[postId]?.trim();
    if (!text) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const res = await fetch(`${BACKEND_URL}/api/discussions/${postId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorName: isAdmin ? 'Jeli' : participantName, isAdmin, text }),
      });
      if (res.ok) {
        const reply = await res.json() as DiscussionReply;
        setPosts((prev) =>
          prev.map((p) => p.id === postId ? { ...p, replies: [...p.replies, reply] } : p)
        );
        setReplyTexts((prev) => ({ ...prev, [postId]: '' }));
        setReplyingTo(null);
        // Auto-expand the post to show the new reply
        setExpandedPosts((prev) => new Set([...prev, postId]));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {}
  };

  const toggleExpand = (id: string) => {
    setExpandedPosts((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <View style={{ paddingVertical: 24, alignItems: 'center' }}>
        <ActivityIndicator size="small" color={colors.primary[400]} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ marginTop: 24, paddingTop: 20, borderTopWidth: 1, borderTopColor: colors.neutral[100] }}>

        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
          <MessageCircle size={16} color={colors.primary[500]} />
          <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800], fontSize: 15, marginLeft: 6, flex: 1 }}>
            Discussion Forum
          </Text>
          {posts.length > 0 && (
            <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, backgroundColor: colors.primary[100] }}>
              <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.primary[600], fontSize: 12 }}>{posts.length}</Text>
            </View>
          )}
        </View>

        {/* Required notice for first post — only shown if not yet posted */}
        {!hasPosted && !isAdmin && (
          <View style={{ marginBottom: 12, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FDE68A' }}>
            <Text style={{ fontFamily: 'DMSans_500Medium', color: '#92400E', fontSize: 12 }}>
              Required: Pose a question or reflection after completing this reading.
            </Text>
          </View>
        )}

        {/* Post input — always accessible for all users */}
        {!isAdmin && (showInput || !hasPosted) ? (
          <View style={{ marginBottom: 16, borderRadius: 14, borderWidth: 1.5, borderColor: colors.primary[200], backgroundColor: colors.primary[50], overflow: 'hidden' }}>
            <TextInput
              value={questionText}
              onChangeText={setQuestionText}
              placeholder="Post your question or reflection…"
              placeholderTextColor={colors.neutral[400]}
              multiline
              style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[800], fontSize: 14, padding: 14, minHeight: 80, textAlignVertical: 'top' }}
            />
            <View style={{ flexDirection: 'row' }}>
              {hasPosted && (
                <Pressable onPress={() => { setShowInput(false); setQuestionText(''); }}
                  style={{ flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: colors.neutral[100] }}>
                  <Text style={{ fontFamily: 'DMSans_500Medium', color: colors.neutral[500], fontSize: 13 }}>Cancel</Text>
                </Pressable>
              )}
              <Pressable
                onPress={submitQuestion}
                disabled={!questionText.trim() || submitting}
                style={{ flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, backgroundColor: questionText.trim() ? colors.primary[500] : colors.neutral[200] }}
              >
                {submitting
                  ? <ActivityIndicator size="small" color="white" />
                  : <>
                    <Send size={14} color={questionText.trim() ? 'white' : colors.neutral[400]} />
                    <Text style={{ fontFamily: 'DMSans_600SemiBold', color: questionText.trim() ? 'white' : colors.neutral[400], fontSize: 14, marginLeft: 6 }}>
                      Post Question
                    </Text>
                  </>
                }
              </Pressable>
            </View>
          </View>
        ) : !isAdmin && hasPosted ? (
          <Pressable onPress={() => setShowInput(true)}
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.primary[200], backgroundColor: colors.primary[50] }}>
            <Send size={14} color={colors.primary[400]} />
            <Text style={{ fontFamily: 'DMSans_500Medium', color: colors.primary[600], fontSize: 13, marginLeft: 8 }}>
              Add another question or comment…
            </Text>
          </Pressable>
        ) : null}

        {/* Posts */}
        {posts.length === 0 ? (
          <View style={{ paddingVertical: 20, alignItems: 'center' }}>
            <MessageCircle size={28} color={colors.neutral[300]} />
            <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[400], fontSize: 13, marginTop: 8, textAlign: 'center' }}>
              No questions yet.{'\n'}Be the first to start the discussion.
            </Text>
          </View>
        ) : (
          posts.map((post) => {
            const isExpanded = expandedPosts.has(post.id) || post.replies.length === 0;
            const isOwn = post.participantCode === participantCode;
            return (
              <View key={post.id} style={{ marginBottom: 12, borderRadius: 14, backgroundColor: 'white', borderWidth: 1, borderColor: isOwn ? colors.primary[200] : colors.neutral[200], overflow: 'hidden' }}>

                {/* Post content */}
                <Pressable onPress={() => post.replies.length > 0 && toggleExpand(post.id)} style={{ padding: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: isOwn ? colors.primary[100] : colors.neutral[100], alignItems: 'center', justifyContent: 'center', marginRight: 10, marginTop: 1 }}>
                      <Text style={{ fontFamily: 'DMSans_600SemiBold', color: isOwn ? colors.primary[600] : colors.neutral[500], fontSize: 12 }}>
                        {initials(post.participantName)}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                        <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[700], fontSize: 13 }}>
                          {isOwn ? 'You' : post.participantName}
                        </Text>
                        <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[400], fontSize: 11, marginLeft: 6 }}>
                          {timeAgo(post.postedAt)}
                        </Text>
                        {post.replies.length > 0 && (
                          <View style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[400], fontSize: 11, marginRight: 2 }}>
                              {post.replies.length} {post.replies.length === 1 ? 'reply' : 'replies'}
                            </Text>
                            {isExpanded ? <ChevronUp size={13} color={colors.neutral[400]} /> : <ChevronDown size={13} color={colors.neutral[400]} />}
                          </View>
                        )}
                      </View>
                      <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[700], fontSize: 14, lineHeight: 20 }}>
                        {post.question}
                      </Text>
                    </View>
                  </View>
                </Pressable>

                {/* Replies */}
                {isExpanded && post.replies.length > 0 && (
                  <View style={{ borderTopWidth: 1, borderTopColor: colors.neutral[100] }}>
                    {post.replies.map((reply) => (
                      <View key={reply.id} style={{ flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 14, paddingVertical: 10, backgroundColor: reply.isAdmin ? '#F0FDF4' : colors.neutral[50] }}>
                        <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: reply.isAdmin ? '#DCFCE7' : colors.neutral[200], alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                          {reply.isAdmin
                            ? <ShieldCheck size={14} color="#16A34A" />
                            : <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[500], fontSize: 11 }}>{initials(reply.authorName)}</Text>
                          }
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
                            <Text style={{ fontFamily: 'DMSans_600SemiBold', color: reply.isAdmin ? '#16A34A' : colors.neutral[600], fontSize: 12 }}>{reply.authorName}</Text>
                            {reply.isAdmin && (
                              <View style={{ marginLeft: 6, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, backgroundColor: '#DCFCE7' }}>
                                <Text style={{ fontFamily: 'DMSans_600SemiBold', color: '#16A34A', fontSize: 10 }}>Jeli</Text>
                              </View>
                            )}
                            <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[400], fontSize: 11, marginLeft: 6 }}>{timeAgo(reply.postedAt)}</Text>
                          </View>
                          <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[700], fontSize: 13, lineHeight: 18 }}>{reply.text}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* Reply input — open to ALL participants and instructor */}
                <View style={{ borderTopWidth: 1, borderTopColor: colors.neutral[100] }}>
                  {replyingTo === post.id ? (
                    <View style={{ padding: 12 }}>
                      <TextInput
                        value={replyTexts[post.id] ?? ''}
                        onChangeText={(t) => setReplyTexts((prev) => ({ ...prev, [post.id]: t }))}
                        placeholder={isAdmin ? 'Write your reply as Jeli…' : 'Write your reply…'}
                        placeholderTextColor={colors.neutral[400]}
                        multiline
                        autoFocus
                        style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[800], fontSize: 13, backgroundColor: colors.neutral[50], borderRadius: 10, padding: 10, minHeight: 60, textAlignVertical: 'top', marginBottom: 8 }}
                      />
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <Pressable onPress={() => setReplyingTo(null)} style={{ flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.neutral[100], alignItems: 'center' }}>
                          <Text style={{ fontFamily: 'DMSans_500Medium', color: colors.neutral[500], fontSize: 13 }}>Cancel</Text>
                        </Pressable>
                        <Pressable onPress={() => submitReply(post.id)} style={{ flex: 2, paddingVertical: 8, borderRadius: 8, backgroundColor: isAdmin ? '#16A34A' : colors.primary[500], alignItems: 'center' }}>
                          <Text style={{ fontFamily: 'DMSans_600SemiBold', color: 'white', fontSize: 13 }}>Send Reply</Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : (
                    <Pressable onPress={() => setReplyingTo(post.id)} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10 }}>
                      <Send size={13} color={isAdmin ? '#16A34A' : colors.primary[400]} />
                      <Text style={{ fontFamily: 'DMSans_500Medium', color: isAdmin ? '#16A34A' : colors.primary[500], fontSize: 13, marginLeft: 6 }}>
                        {isAdmin ? 'Reply as Jeli' : 'Reply'}
                      </Text>
                    </Pressable>
                  )}
                </View>

              </View>
            );
          })
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
