import React from 'react';
import { View, Text, ScrollView, Pressable, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { FileText, BookOpen, Music, ExternalLink, Globe, MapPin, ArrowLeft, Play } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useFonts, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold } from '@expo-google-fonts/dm-sans';

import { colors } from '@/lib/theme';
import { resourceLinks, videoLinks, foundationalPrinciples, mandinkaTerms } from '@/lib/mockData';

export default function ResourcesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
  });

  if (!fontsLoaded) {
    return null;
  }

  const openNotationPDF = () => {
    Linking.openURL(resourceLinks.notationImages);
  };

  const openSyllabus = () => {
    Linking.openURL(resourceLinks.syllabus);
  };

  const openCulturalResearch = () => {
    Linking.openURL(resourceLinks.culturalResearch);
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.cream[100] }}>
      <LinearGradient
        colors={[colors.primary[500], colors.primary[600]]}
        style={{ paddingTop: insets.top + 16, paddingBottom: 24, paddingHorizontal: 24 }}
      >
        <Animated.View entering={FadeInDown.duration(600)} className="flex-row items-center">
          <Pressable
            onPress={() => router.push('/(tabs)/')}
            className="mr-4 p-2 -ml-2"
          >
            <ArrowLeft size={24} color="white" />
          </Pressable>
          <View>
            <Text
              style={{ fontFamily: 'PlayfairDisplay_700Bold', color: 'white' }}
              className="text-2xl"
            >
              Resources
            </Text>
            <Text
              style={{ fontFamily: 'DMSans_400Regular', color: colors.gold[300] }}
              className="text-sm mt-1"
            >
              AFeeree notation system and reference materials
            </Text>
          </View>
        </Animated.View>
      </LinearGradient>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Notation System Section */}
        <Animated.View entering={FadeInDown.duration(600).delay(100)} className="px-6 mt-6">
          <Text
            style={{ fontFamily: 'PlayfairDisplay_700Bold', color: colors.neutral[800] }}
            className="text-xl mb-2"
          >
            AFeeree Notation System
          </Text>
          <Text
            style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[600] }}
            className="text-sm mb-4"
          >
            The AFeeree notation system is a visual language for documenting and communicating movement. Study these symbols to read and write AFeeree choreography.
          </Text>

          <Pressable
            className="rounded-2xl overflow-hidden mb-4"
            style={{ backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 }}
            onPress={openNotationPDF}
          >
            <LinearGradient
              colors={[colors.primary[400], colors.primary[600]]}
              style={{ padding: 20, flexDirection: 'row', alignItems: 'center' }}
            >
              <View
                className="w-14 h-14 rounded-xl items-center justify-center"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
              >
                <FileText size={28} color="white" />
              </View>
              <View className="flex-1 ml-4">
                <Text
                  style={{ fontFamily: 'DMSans_600SemiBold', color: 'white' }}
                  className="text-lg"
                >
                  Word Pages Notation
                </Text>
                <Text
                  style={{ fontFamily: 'DMSans_400Regular', color: colors.gold[300] }}
                  className="text-sm mt-1"
                >
                  Tap to view the complete notation guide
                </Text>
              </View>
              <ExternalLink size={24} color="white" />
            </LinearGradient>
          </Pressable>
        </Animated.View>

        {/* Syllabus Document */}
        <Animated.View entering={FadeInDown.duration(600).delay(150)} className="px-6">
          <Pressable
            className="rounded-2xl p-4 flex-row items-center mb-4"
            style={{ backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}
            onPress={openSyllabus}
          >
            <View
              className="w-12 h-12 rounded-xl items-center justify-center"
              style={{ backgroundColor: colors.gold[100] }}
            >
              <BookOpen size={24} color={colors.gold[600]} />
            </View>
            <View className="flex-1 ml-4">
              <Text
                style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800] }}
                className="text-base"
              >
                Course Syllabus
              </Text>
              <Text
                style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500] }}
                className="text-sm"
              >
                Complete curriculum document
              </Text>
            </View>
            <ExternalLink size={20} color={colors.neutral[400]} />
          </Pressable>
        </Animated.View>

        {/* Cultural Context & Research Section */}
        <Animated.View entering={FadeInDown.duration(600).delay(175)} className="px-6">
          <Text
            style={{ fontFamily: 'PlayfairDisplay_700Bold', color: colors.neutral[800] }}
            className="text-xl mb-2"
          >
            Cultural Context & Research
          </Text>
          <Text
            style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[600] }}
            className="text-sm mb-4"
          >
            AFeeree is grounded in ethnographic research conducted across the African diaspora. This document explores the cultural foundations and research methodology behind the practice.
          </Text>

          <Pressable
            className="rounded-2xl overflow-hidden mb-6"
            style={{ backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 }}
            onPress={openCulturalResearch}
          >
            <LinearGradient
              colors={[colors.gold[500], colors.gold[700]]}
              style={{ padding: 20, flexDirection: 'row', alignItems: 'center' }}
            >
              <View
                className="w-14 h-14 rounded-xl items-center justify-center"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
              >
                <Globe size={28} color="white" />
              </View>
              <View className="flex-1 ml-4">
                <Text
                  style={{ fontFamily: 'DMSans_600SemiBold', color: 'white' }}
                  className="text-lg"
                >
                  Cultural Research Document
                </Text>
                <Text
                  style={{ fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.8)' }}
                  className="text-sm mt-1"
                >
                  Ethnographic foundations of AFeeree
                </Text>
              </View>
              <ExternalLink size={24} color="white" />
            </LinearGradient>
          </Pressable>

          {/* Research Locations */}
          <View
            className="rounded-2xl p-4 mb-6"
            style={{ backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}
          >
            <Text
              style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800] }}
              className="text-base mb-3"
            >
              Research Locations
            </Text>
            {['Senegal', 'The Gambia', 'Trinidad and Tobago', 'Haiti', 'North America'].map((location, index) => (
              <View key={location} className="flex-row items-center mb-2">
                <MapPin size={16} color={colors.gold[600]} />
                <Text
                  style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[600] }}
                  className="text-sm ml-2"
                >
                  {location}
                </Text>
              </View>
            ))}
            <Text
              style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500] }}
              className="text-xs mt-2 italic"
            >
              Under the mentorship of Griot Alassane Sarr
            </Text>
          </View>
        </Animated.View>

        {/* Seven Foundational Principles */}
        <Animated.View entering={FadeInDown.duration(600).delay(200)} className="px-6">
          <Text
            style={{ fontFamily: 'PlayfairDisplay_700Bold', color: colors.neutral[800] }}
            className="text-xl mb-4"
          >
            Seven Foundational Principles
          </Text>

          {/* Key Principles Video */}
          <Pressable
            className="rounded-2xl overflow-hidden mb-4"
            style={{ backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 }}
            onPress={() => Linking.openURL(videoLinks.keyPrinciples)}
          >
            <LinearGradient
              colors={[colors.primary[500], colors.primary[700]]}
              style={{ padding: 16, flexDirection: 'row', alignItems: 'center' }}
            >
              <View
                className="w-12 h-12 rounded-full items-center justify-center"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
              >
                <Play size={24} color="white" fill="white" />
              </View>
              <View className="flex-1 ml-4">
                <Text
                  style={{ fontFamily: 'DMSans_600SemiBold', color: 'white' }}
                  className="text-base"
                >
                  Watch Key Principles Video
                </Text>
                <Text
                  style={{ fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.8)' }}
                  className="text-sm mt-0.5"
                >
                  Video explanation of the foundational concepts
                </Text>
              </View>
            </LinearGradient>
          </Pressable>

          {foundationalPrinciples.map((principle, index) => (
            <Animated.View
              key={principle.name}
              entering={FadeInDown.duration(400).delay(250 + index * 50)}
              className="rounded-xl p-4 mb-3"
              style={{ backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 }}
            >
              <View className="flex-row items-center">
                <View
                  className="w-8 h-8 rounded-full items-center justify-center"
                  style={{ backgroundColor: colors.primary[100] }}
                >
                  <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.primary[500] }} className="text-sm">
                    {index + 1}
                  </Text>
                </View>
                <Text
                  style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800] }}
                  className="text-base ml-3"
                >
                  {principle.name}
                </Text>
              </View>
              <Text
                style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[600] }}
                className="text-sm mt-2 ml-11"
              >
                {principle.description}
              </Text>
            </Animated.View>
          ))}
        </Animated.View>

        {/* Mandinka Terminology */}
        <Animated.View entering={FadeInDown.duration(600).delay(300)} className="px-6 mt-6">
          <Text
            style={{ fontFamily: 'PlayfairDisplay_700Bold', color: colors.neutral[800] }}
            className="text-xl mb-4"
          >
            Mandinka Terminology
          </Text>

          <View
            className="rounded-2xl overflow-hidden"
            style={{ backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}
          >
            {mandinkaTerms.map((item, index) => (
              <View
                key={item.term}
                className={`flex-row items-center p-4 ${index < mandinkaTerms.length - 1 ? 'border-b' : ''}`}
                style={{ borderColor: colors.neutral[100] }}
              >
                <View
                  className="w-10 h-10 rounded-lg items-center justify-center"
                  style={{ backgroundColor: colors.gold[100] }}
                >
                  <Music size={18} color={colors.gold[600]} />
                </View>
                <View className="ml-4">
                  <Text
                    style={{ fontFamily: 'DMSans_600SemiBold', color: colors.primary[600] }}
                    className="text-base"
                  >
                    {item.term}
                  </Text>
                  <Text
                    style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500] }}
                    className="text-sm"
                  >
                    {item.meaning}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
