import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Send, User, MessageCircle, ChevronRight } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useFonts, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold } from '@expo-google-fonts/dm-sans';
import * as Haptics from 'expo-haptics';

import { colors } from '@/lib/theme';
import { mockParticipants, mockFeedbackMessages, mockUser } from '@/lib/mockData';
import type { Participant, FeedbackMessage } from '@/lib/types';

const triggerHaptic = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

export default function FeedbackScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);

  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [messages, setMessages] = useState<FeedbackMessage[]>(mockFeedbackMessages);
  const [newMessage, setNewMessage] = useState('');

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
  });

  useEffect(() => {
    if (selectedParticipant && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [selectedParticipant, messages]);

  if (!fontsLoaded) {
    return null;
  }

  const navigateWithHaptic = (route: string) => {
    triggerHaptic();
    router.push(route as any);
  };

  const handleSelectParticipant = (participant: Participant) => {
    triggerHaptic();
    setSelectedParticipant(participant);
  };

  const handleBack = () => {
    triggerHaptic();
    if (selectedParticipant) {
      setSelectedParticipant(null);
    } else {
      router.push('/(tabs)/');
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedParticipant) return;

    triggerHaptic();

    const message: FeedbackMessage = {
      id: Date.now().toString(),
      senderId: mockUser.id,
      senderName: mockUser.name,
      senderRole: mockUser.role,
      recipientId: selectedParticipant.id,
      recipientName: selectedParticipant.name,
      message: newMessage.trim(),
      timestamp: new Date().toISOString(),
      read: false,
    };

    setMessages([...messages, message]);
    setNewMessage('');
  };

  const getConversation = (participantId: string) => {
    return messages.filter(
      m => (m.senderId === participantId && m.recipientId === mockUser.id) ||
           (m.senderId === mockUser.id && m.recipientId === participantId) ||
           (m.senderId === 'admin' && m.recipientId === participantId) ||
           (m.senderId === participantId && m.recipientId === 'admin')
    ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  };

  const getLastMessage = (participantId: string) => {
    const conversation = getConversation(participantId);
    return conversation[conversation.length - 1];
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Conversation View
  if (selectedParticipant) {
    const conversation = getConversation(selectedParticipant.id);

    return (
      <View className="flex-1" style={{ backgroundColor: colors.cream[100] }}>
        {/* Header */}
        <View
          style={{ paddingTop: insets.top + 12, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: colors.neutral[200] }}
          className="px-4 pb-4"
        >
          <View className="flex-row items-center">
            <Pressable onPress={handleBack} className="p-2 -ml-2 mr-2">
              <ArrowLeft size={24} color={colors.neutral[800]} />
            </Pressable>
            <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: colors.primary[100] }}>
              <User size={20} color={colors.primary[500]} />
            </View>
            <View className="ml-3 flex-1">
              <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800] }} className="text-base">
                {selectedParticipant.name}
              </Text>
              <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500] }} className="text-xs">
                {selectedParticipant.certificationLevel} • {selectedParticipant.progress}% complete
              </Text>
            </View>
          </View>
        </View>

        {/* Messages */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
          keyboardVerticalOffset={0}
        >
          <ScrollView
            ref={scrollViewRef}
            className="flex-1 px-4 py-4"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {conversation.length === 0 ? (
              <View className="flex-1 items-center justify-center py-20">
                <MessageCircle size={48} color={colors.neutral[300]} />
                <Text style={{ fontFamily: 'DMSans_500Medium', color: colors.neutral[500] }} className="text-base mt-4">
                  No messages yet
                </Text>
                <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[400] }} className="text-sm mt-1 text-center">
                  Send feedback to {selectedParticipant.name}
                </Text>
              </View>
            ) : (
              conversation.map((msg, index) => {
                const isFromMe = msg.senderId === mockUser.id || msg.senderId === 'admin';
                const showDate = index === 0 ||
                  formatDate(msg.timestamp) !== formatDate(conversation[index - 1].timestamp);

                return (
                  <View key={msg.id}>
                    {showDate && (
                      <Text
                        style={{ fontFamily: 'DMSans_500Medium', color: colors.neutral[400] }}
                        className="text-xs text-center my-4"
                      >
                        {formatDate(msg.timestamp)}
                      </Text>
                    )}
                    <Animated.View
                      entering={FadeInUp.duration(300)}
                      className={`mb-3 max-w-[80%] ${isFromMe ? 'self-end' : 'self-start'}`}
                    >
                      <View
                        className="px-4 py-3 rounded-2xl"
                        style={{
                          backgroundColor: isFromMe ? colors.primary[500] : 'white',
                          borderBottomRightRadius: isFromMe ? 4 : 16,
                          borderBottomLeftRadius: isFromMe ? 16 : 4,
                        }}
                      >
                        <Text
                          style={{
                            fontFamily: 'DMSans_400Regular',
                            color: isFromMe ? 'white' : colors.neutral[800],
                            lineHeight: 20
                          }}
                          className="text-sm"
                        >
                          {msg.message}
                        </Text>
                      </View>
                      <Text
                        style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[400] }}
                        className={`text-xs mt-1 ${isFromMe ? 'text-right' : 'text-left'}`}
                      >
                        {formatTime(msg.timestamp)}
                      </Text>
                    </Animated.View>
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* Input */}
          <View
            style={{
              paddingBottom: insets.bottom + 8,
              backgroundColor: 'white',
              borderTopWidth: 1,
              borderTopColor: colors.neutral[200]
            }}
            className="px-4 pt-3"
          >
            <View className="flex-row items-end">
              <TextInput
                value={newMessage}
                onChangeText={setNewMessage}
                placeholder="Type your feedback..."
                placeholderTextColor={colors.neutral[400]}
                multiline
                style={{
                  fontFamily: 'DMSans_400Regular',
                  color: colors.neutral[800],
                  backgroundColor: colors.neutral[100],
                  maxHeight: 100,
                }}
                className="flex-1 px-4 py-3 rounded-2xl text-sm"
              />
              <Pressable
                onPress={handleSendMessage}
                disabled={!newMessage.trim()}
                className="ml-2 w-11 h-11 rounded-full items-center justify-center"
                style={{
                  backgroundColor: newMessage.trim() ? colors.primary[500] : colors.neutral[200]
                }}
              >
                <Send size={20} color={newMessage.trim() ? 'white' : colors.neutral[400]} />
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    );
  }

  // Participants List View
  return (
    <View className="flex-1" style={{ backgroundColor: colors.cream[100] }}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 24, paddingBottom: 16 }}>
          <Animated.View entering={FadeInDown.duration(600)} className="flex-row items-center">
            <Pressable
              onPress={handleBack}
              className="mr-4 p-2 -ml-2"
            >
              <ArrowLeft size={24} color={colors.neutral[800]} />
            </Pressable>
            <View>
              <Text
                style={{ fontFamily: 'PlayfairDisplay_700Bold', color: colors.neutral[800] }}
                className="text-3xl"
              >
                Feedback
              </Text>
              <Text
                style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500] }}
                className="text-base mt-1"
              >
                Two-way communication with participants
              </Text>
            </View>
          </Animated.View>
        </View>

        {/* Participants List */}
        <View className="px-6">
          <Text
            style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800] }}
            className="text-lg mb-4"
          >
            Participants
          </Text>

          {mockParticipants.length === 0 ? (
            <Animated.View
              entering={FadeInUp.duration(500)}
              className="items-center justify-center py-16"
            >
              <View
                className="w-20 h-20 rounded-full items-center justify-center mb-4"
                style={{ backgroundColor: colors.neutral[100] }}
              >
                <User size={40} color={colors.neutral[300]} />
              </View>
              <Text
                style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[600] }}
                className="text-lg text-center"
              >
                No participants yet
              </Text>
              <Text
                style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[400] }}
                className="text-sm text-center mt-2 px-8"
              >
                Participants will appear here once they join the program
              </Text>
            </Animated.View>
          ) : (
            mockParticipants.map((participant, index) => {
              const lastMessage = getLastMessage(participant.id);

              return (
                <Animated.View
                  key={participant.id}
                  entering={FadeInUp.duration(500).delay(100 + index * 100)}
                >
                  <Pressable
                    onPress={() => handleSelectParticipant(participant)}
                    className="mb-3 p-4 rounded-2xl flex-row items-center"
                    style={{
                      backgroundColor: 'white',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.05,
                      shadowRadius: 8,
                      elevation: 2,
                    }}
                  >
                    <View
                      className="w-12 h-12 rounded-full items-center justify-center"
                      style={{ backgroundColor: colors.primary[100] }}
                    >
                      <User size={24} color={colors.primary[500]} />
                    </View>

                    <View className="flex-1 ml-4">
                      <View className="flex-row items-center justify-between">
                        <Text
                          style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800] }}
                          className="text-base"
                        >
                          {participant.name}
                        </Text>
                        {lastMessage && (
                          <Text
                            style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[400] }}
                            className="text-xs"
                          >
                            {formatDate(lastMessage.timestamp)}
                          </Text>
                        )}
                      </View>

                      <View className="flex-row items-center mt-1">
                        <View
                          className="px-2 py-0.5 rounded-full mr-2"
                          style={{ backgroundColor: colors.gold[100] }}
                        >
                          <Text
                            style={{ fontFamily: 'DMSans_500Medium', color: colors.gold[700] }}
                            className="text-xs"
                          >
                            {participant.certificationLevel}
                          </Text>
                        </View>
                        <Text
                          style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500] }}
                          className="text-xs"
                        >
                          {participant.progress}% complete
                        </Text>
                      </View>

                      {lastMessage && (
                        <Text
                          style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500] }}
                          className="text-sm mt-2"
                          numberOfLines={1}
                        >
                          {lastMessage.senderRole === 'admin' || lastMessage.senderId === mockUser.id ? 'You: ' : ''}
                          {lastMessage.message}
                        </Text>
                      )}
                    </View>

                    <ChevronRight size={20} color={colors.neutral[400]} />
                  </Pressable>
                </Animated.View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}
