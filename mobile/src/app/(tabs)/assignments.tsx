import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, Modal, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  FileText,
  Video,
  Users,
  PenLine,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  X,
  Upload,
  Camera,
  File,
  ArrowLeft
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated';
import { useFonts, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold } from '@expo-google-fonts/dm-sans';
import * as Haptics from 'expo-haptics';

import { colors } from '@/lib/theme';
import { mockAssignments } from '@/lib/mockData';
import type { Assignment } from '@/lib/types';

const triggerHaptic = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

const statusFilters = ['All', 'Pending', 'Submitted', 'Graded'] as const;

export default function AssignmentsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    triggerHaptic();
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const navigateWithHaptic = (route: string) => {
    triggerHaptic();
    router.push(route as any);
  };

  const handleFilterPress = (filter: string) => {
    Haptics.selectionAsync();
    setSelectedFilter(filter);
  };

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
  });

  if (!fontsLoaded) {
    return null;
  }

  const filteredAssignments = selectedFilter === 'All'
    ? mockAssignments
    : mockAssignments.filter(a => {
        if (selectedFilter === 'Pending') return a.status === 'pending';
        if (selectedFilter === 'Submitted') return a.status === 'submitted';
        if (selectedFilter === 'Graded') return a.status === 'graded' || a.status === 'resubmit';
        return true;
      });

  const getTypeIcon = (type: Assignment['type']) => {
    switch (type) {
      case 'video':
        return <Video size={20} color={colors.primary[500]} />;
      case 'document':
        return <FileText size={20} color={colors.primary[500]} />;
      case 'teaching_demo':
        return <Users size={20} color={colors.primary[500]} />;
      case 'reflection':
        return <PenLine size={20} color={colors.primary[500]} />;
    }
  };

  const getStatusConfig = (status: Assignment['status']) => {
    switch (status) {
      case 'pending':
        return { icon: <Clock size={16} color={colors.gold[600]} />, color: colors.gold[600], bg: colors.gold[100], label: 'Pending' };
      case 'submitted':
        return { icon: <CheckCircle2 size={16} color={colors.info} />, color: colors.info, bg: '#EBF5FF', label: 'Submitted' };
      case 'graded':
        return { icon: <CheckCircle2 size={16} color={colors.success} />, color: colors.success, bg: '#ECFDF5', label: 'Graded' };
      case 'resubmit':
        return { icon: <AlertCircle size={16} color={colors.warning} />, color: colors.warning, bg: '#FFF7ED', label: 'Resubmit' };
    }
  };

  const handleAssignmentPress = (assignment: Assignment) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedAssignment(assignment);
  };

  const handleSubmitPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowSubmitModal(true);
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.cream[100] }}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary[500]}
            colors={[colors.primary[500]]}
          />
        }
      >
        {/* Header */}
        <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 24, paddingBottom: 16 }}>
          <Animated.View entering={FadeInDown.duration(600)} className="flex-row items-center">
            <Pressable
              onPress={() => navigateWithHaptic('/(tabs)/')}
              className="mr-4 p-2 -ml-2"
            >
              <ArrowLeft size={24} color={colors.neutral[800]} />
            </Pressable>
            <View>
              <Text
                style={{ fontFamily: 'PlayfairDisplay_700Bold', color: colors.neutral[800] }}
                className="text-3xl"
              >
                Assignments
              </Text>
              <Text
                style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500] }}
                className="text-base mt-1"
              >
                Submit your work and track progress
              </Text>
            </View>
          </Animated.View>
        </View>

        {/* Status Filter */}
        <Animated.View entering={FadeInDown.duration(600).delay(100)}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="px-6"
            contentContainerStyle={{ paddingRight: 24 }}
            style={{ flexGrow: 0 }}
          >
            {statusFilters.map((filter) => (
              <Pressable
                key={filter}
                onPress={() => handleFilterPress(filter)}
                className="mr-2 px-4 py-2 rounded-full"
                style={{
                  backgroundColor: selectedFilter === filter ? colors.primary[500] : 'white',
                  borderWidth: 1,
                  borderColor: selectedFilter === filter ? colors.primary[500] : colors.neutral[200],
                }}
              >
                <Text
                  style={{
                    fontFamily: 'DMSans_500Medium',
                    color: selectedFilter === filter ? 'white' : colors.neutral[600]
                  }}
                  className="text-sm"
                >
                  {filter}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Assignments List */}
        <View className="px-6 mt-6">
          {filteredAssignments.map((assignment, index) => {
            const statusConfig = getStatusConfig(assignment.status);
            return (
              <Animated.View
                key={assignment.id}
                entering={FadeInUp.duration(500).delay(200 + index * 80)}
              >
                <Pressable
                  onPress={() => handleAssignmentPress(assignment)}
                  className="mb-4 p-4 rounded-2xl"
                  style={{
                    backgroundColor: 'white',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.06,
                    shadowRadius: 8,
                    elevation: 2,
                  }}
                >
                  <View className="flex-row items-start">
                    {/* Type Icon */}
                    <View
                      className="w-12 h-12 rounded-xl items-center justify-center"
                      style={{ backgroundColor: colors.primary[100] }}
                    >
                      {getTypeIcon(assignment.type)}
                    </View>

                    {/* Content */}
                    <View className="flex-1 ml-4">
                      <View className="flex-row items-center justify-between">
                        <Text
                          style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800] }}
                          className="text-base flex-1"
                          numberOfLines={1}
                        >
                          {assignment.title}
                        </Text>
                        <View
                          className="px-2 py-1 rounded-full flex-row items-center ml-2"
                          style={{ backgroundColor: statusConfig.bg }}
                        >
                          {statusConfig.icon}
                          <Text
                            style={{ fontFamily: 'DMSans_500Medium', color: statusConfig.color }}
                            className="text-xs ml-1"
                          >
                            {statusConfig.label}
                          </Text>
                        </View>
                      </View>

                      <Text
                        style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500] }}
                        className="text-sm mt-1"
                      >
                        {assignment.moduleName}
                      </Text>

                      <View className="flex-row items-center mt-3">
                        <Clock size={14} color={colors.neutral[400]} />
                        <Text
                          style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500] }}
                          className="text-xs ml-1"
                        >
                          Due: {new Date(assignment.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </Text>
                        {assignment.grade && (
                          <>
                            <View className="mx-2 w-1 h-1 rounded-full" style={{ backgroundColor: colors.neutral[300] }} />
                            <Text
                              style={{ fontFamily: 'DMSans_600SemiBold', color: colors.success }}
                              className="text-xs"
                            >
                              Grade: {assignment.grade}
                            </Text>
                          </>
                        )}
                      </View>
                    </View>
                  </View>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>

      {/* Assignment Detail Modal */}
      <Modal
        visible={selectedAssignment !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedAssignment(null)}
      >
        {selectedAssignment && (
          <View className="flex-1" style={{ backgroundColor: colors.cream[100] }}>
            <View className="px-6 pt-4 pb-4 flex-row items-center justify-between" style={{ borderBottomWidth: 1, borderBottomColor: colors.neutral[200] }}>
              <Text
                style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800] }}
                className="text-lg"
              >
                Assignment Details
              </Text>
              <Pressable
                onPress={() => setSelectedAssignment(null)}
                className="p-2"
              >
                <X size={24} color={colors.neutral[600]} />
              </Pressable>
            </View>

            <ScrollView className="flex-1 px-6 pt-6">
              <Animated.View entering={FadeIn.duration(400)}>
                {/* Status Badge */}
                <View
                  className="self-start px-3 py-1.5 rounded-full flex-row items-center"
                  style={{ backgroundColor: getStatusConfig(selectedAssignment.status).bg }}
                >
                  {getStatusConfig(selectedAssignment.status).icon}
                  <Text
                    style={{ fontFamily: 'DMSans_500Medium', color: getStatusConfig(selectedAssignment.status).color }}
                    className="text-sm ml-1"
                  >
                    {getStatusConfig(selectedAssignment.status).label}
                  </Text>
                </View>

                {/* Title */}
                <Text
                  style={{ fontFamily: 'PlayfairDisplay_700Bold', color: colors.neutral[800] }}
                  className="text-2xl mt-4"
                >
                  {selectedAssignment.title}
                </Text>

                {/* Module */}
                <Text
                  style={{ fontFamily: 'DMSans_500Medium', color: colors.primary[500] }}
                  className="text-base mt-2"
                >
                  {selectedAssignment.moduleName}
                </Text>

                {/* Description */}
                <Text
                  style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[600] }}
                  className="text-base mt-4 leading-6"
                >
                  {selectedAssignment.description}
                </Text>

                {/* Details Card */}
                <View
                  className="mt-6 p-4 rounded-xl"
                  style={{ backgroundColor: 'white', borderWidth: 1, borderColor: colors.neutral[200] }}
                >
                  <View className="flex-row justify-between py-2">
                    <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500] }}>
                      Due Date
                    </Text>
                    <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800] }}>
                      {new Date(selectedAssignment.dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </Text>
                  </View>
                  {selectedAssignment.submittedDate && (
                    <View className="flex-row justify-between py-2 border-t" style={{ borderTopColor: colors.neutral[100] }}>
                      <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500] }}>
                        Submitted
                      </Text>
                      <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800] }}>
                        {new Date(selectedAssignment.submittedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </Text>
                    </View>
                  )}
                  {selectedAssignment.grade && (
                    <View className="flex-row justify-between py-2 border-t" style={{ borderTopColor: colors.neutral[100] }}>
                      <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500] }}>
                        Grade
                      </Text>
                      <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.success }}>
                        {selectedAssignment.grade}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Feedback */}
                {selectedAssignment.feedback && (
                  <View
                    className="mt-4 p-4 rounded-xl"
                    style={{ backgroundColor: colors.success + '15', borderWidth: 1, borderColor: colors.success + '30' }}
                  >
                    <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.success }} className="text-sm mb-2">
                      Instructor Feedback
                    </Text>
                    <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[700] }} className="text-base leading-6">
                      {selectedAssignment.feedback}
                    </Text>
                  </View>
                )}
              </Animated.View>
            </ScrollView>

            {/* Submit Button */}
            {selectedAssignment.status === 'pending' && (
              <View className="px-6 pb-8 pt-4" style={{ backgroundColor: colors.cream[100] }}>
                <Pressable
                  onPress={handleSubmitPress}
                  className="py-4 rounded-xl flex-row items-center justify-center"
                  style={{ backgroundColor: colors.primary[500] }}
                >
                  <Upload size={20} color="white" />
                  <Text
                    style={{ fontFamily: 'DMSans_600SemiBold', color: 'white' }}
                    className="text-base ml-2"
                  >
                    Submit Assignment
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        )}
      </Modal>

      {/* Submit Options Modal */}
      <Modal
        visible={showSubmitModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSubmitModal(false)}
      >
        <View className="flex-1" style={{ backgroundColor: colors.cream[100] }}>
          <View className="px-6 pt-4 pb-4 flex-row items-center justify-between" style={{ borderBottomWidth: 1, borderBottomColor: colors.neutral[200] }}>
            <Text
              style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800] }}
              className="text-lg"
            >
              Submit Assignment
            </Text>
            <Pressable
              onPress={() => setShowSubmitModal(false)}
              className="p-2"
            >
              <X size={24} color={colors.neutral[600]} />
            </Pressable>
          </View>

          <View className="flex-1 px-6 pt-8">
            <Text
              style={{ fontFamily: 'PlayfairDisplay_700Bold', color: colors.neutral[800] }}
              className="text-2xl text-center"
            >
              Choose Submission Type
            </Text>
            <Text
              style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500] }}
              className="text-base text-center mt-2 mb-8"
            >
              Select how you want to submit your work
            </Text>

            <Pressable
              className="p-5 rounded-2xl mb-4 flex-row items-center"
              style={{ backgroundColor: 'white', borderWidth: 1, borderColor: colors.neutral[200] }}
            >
              <View className="w-14 h-14 rounded-xl items-center justify-center" style={{ backgroundColor: colors.primary[100] }}>
                <Camera size={28} color={colors.primary[500]} />
              </View>
              <View className="ml-4 flex-1">
                <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800] }} className="text-base">
                  Record Video
                </Text>
                <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500] }} className="text-sm mt-0.5">
                  Capture teaching demos or practice
                </Text>
              </View>
            </Pressable>

            <Pressable
              className="p-5 rounded-2xl mb-4 flex-row items-center"
              style={{ backgroundColor: 'white', borderWidth: 1, borderColor: colors.neutral[200] }}
            >
              <View className="w-14 h-14 rounded-xl items-center justify-center" style={{ backgroundColor: colors.gold[100] }}>
                <File size={28} color={colors.gold[600]} />
              </View>
              <View className="ml-4 flex-1">
                <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800] }} className="text-base">
                  Upload File
                </Text>
                <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500] }} className="text-sm mt-0.5">
                  Documents, videos, or images
                </Text>
              </View>
            </Pressable>

            <Pressable
              className="p-5 rounded-2xl flex-row items-center"
              style={{ backgroundColor: 'white', borderWidth: 1, borderColor: colors.neutral[200] }}
            >
              <View className="w-14 h-14 rounded-xl items-center justify-center" style={{ backgroundColor: colors.primary[100] }}>
                <PenLine size={28} color={colors.primary[500]} />
              </View>
              <View className="ml-4 flex-1">
                <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800] }} className="text-base">
                  Write Reflection
                </Text>
                <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500] }} className="text-sm mt-0.5">
                  Text-based assignments
                </Text>
              </View>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
