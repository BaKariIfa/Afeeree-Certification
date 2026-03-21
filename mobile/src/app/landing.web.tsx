import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  BookOpen,
  Award,
  Users,
  Play,
  ChevronRight,
  Check,
  Star,
  ArrowRight,
  Key
} from 'lucide-react-native';
import { useFonts, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold } from '@expo-google-fonts/dm-sans';

import { colors } from '@/lib/theme';

export default function LandingPage() {
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
  });

  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (!fontsLoaded) {
    return null;
  }

  const features = [
    {
      icon: BookOpen,
      title: 'Experience the Physical Language',
      description: 'Immerse yourself in the physicality of Africanist movement through hands-on exploration of technique and embodied practice.',
    },
    {
      icon: Users,
      title: 'Understand the Research',
      description: 'Gain insight into the scholarly research and cultural foundations behind AFeeree methodology, preparing you for deeper study.',
    },
    {
      icon: Award,
      title: 'Prepare for Certification',
      description: 'This introduction prepares you for more in-depth study and potential teaching certification in the AFeeree methodology.',
    },
  ];

  const modules = [
    {
      title: 'Introduction to AFeeree Movement Principles',
      synopsis: 'An overview of the AFeeree methodology and its foundational movement vocabulary. Students are introduced to the seven principles that underpin every aspect of the physical language, including polyrhythm, polycentrism, and holism.',
    },
    {
      title: 'Experiencing the Physical Language',
      synopsis: 'Hands-on exploration of Africanist movement through guided practice. Students embody the concepts by developing through the natural bends of the body, basic kata forms, and partner observation, cultivating a felt sense of the methodology.',
    },
    {
      title: 'Polyrhythmic Body Isolations',
      synopsis: 'A focused study of the body\'s ability to move multiple centres simultaneously. Exercises develop independence between the upper and lower body, training feet to hold a foundational rhythm while the torso layers additional patterns.',
    },
    {
      title: 'Understanding the Research Foundation',
      synopsis: 'An introduction to the scholarly research behind AFeeree, drawing on African aesthetics theory, ethnochoreology, and BaKari Lindsay\'s master\'s thesis. Students gain insight into how academic research informs practical movement training.',
    },
    {
      title: 'Cultural Context & Historical Framework',
      synopsis: 'An exploration of the African and Caribbean cultural traditions that shape the AFeeree aesthetic. Students examine how history, diaspora, and community inform movement practices and the responsibilities that come with teaching this work.',
    },
    {
      title: 'Preparation for Advanced Study',
      synopsis: 'A reflective session bridging introductory experience with the full Certification Program. Students review core concepts, discuss pathways toward teaching certification, and are guided on how to deepen their practice.',
    },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.cream[100] }}>
      {/* Hero Section */}
      <LinearGradient
        colors={[colors.primary[600], colors.primary[500]]}
        style={{ paddingTop: 60, paddingBottom: 80, paddingHorizontal: 24 }}
      >
        {/* Navigation */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 60 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image
              source={require('../../public/image-1769399524.png')}
              style={{ width: 40, height: 40, borderRadius: 20 }}
              contentFit="cover"
            />
            <Text
              style={{
                fontFamily: 'PlayfairDisplay_700Bold',
                color: colors.gold[300],
                fontSize: 18,
                marginLeft: 12,
              }}
            >
              AFeeree
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/access-code')}
            style={{
              backgroundColor: 'rgba(255,255,255,0.15)',
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 8,
            }}
          >
            <Text style={{ fontFamily: 'DMSans_500Medium', color: 'white', fontSize: 14 }}>
              Sign In
            </Text>
          </Pressable>
        </View>

        {/* Hero Content */}
        <View style={{ alignItems: 'center' }}>
          <Image
            source={require('../../public/image-1769399524.png')}
            style={{ width: 120, height: 120, borderRadius: 60, marginBottom: 24 }}
            contentFit="cover"
          />
          <Text
            style={{
              fontFamily: 'PlayfairDisplay_700Bold',
              color: colors.gold[300],
              fontSize: 36,
              textAlign: 'center',
              lineHeight: 44,
            }}
          >
            AFeeree Certification
          </Text>
          <Text
            style={{
              fontFamily: 'DMSans_400Regular',
              color: 'rgba(255,255,255,0.85)',
              fontSize: 18,
              textAlign: 'center',
              marginTop: 12,
              maxWidth: 500,
            }}
          >
            Experience the physicality of Africanist movement and explore the research behind it
          </Text>

          <View style={{ flexDirection: 'row', gap: 16, marginTop: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Pressable
              onPress={() => router.push('/purchase')}
              style={{
                backgroundColor: colors.gold[500],
                paddingHorizontal: 32,
                paddingVertical: 16,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.primary[800], fontSize: 16 }}>
                Enroll Now
              </Text>
              <ArrowRight size={20} color={colors.primary[800]} style={{ marginLeft: 8 }} />
            </Pressable>

            <Pressable
              onPress={() => router.push('/access-code')}
              style={{
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderColor: 'rgba(255,255,255,0.3)',
                paddingHorizontal: 32,
                paddingVertical: 16,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Key size={18} color="white" style={{ marginRight: 8 }} />
              <Text style={{ fontFamily: 'DMSans_600SemiBold', color: 'white', fontSize: 16 }}>
                Enter Access Code
              </Text>
            </Pressable>
          </View>
        </View>
      </LinearGradient>

      {/* About Section */}
      <View style={{ padding: 24, paddingVertical: 60 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 32, alignItems: 'center' }}>
          <View style={{ flex: 1, minWidth: 280 }}>
            <Text
              style={{
                fontFamily: 'DMSans_500Medium',
                color: colors.gold[600],
                fontSize: 14,
                letterSpacing: 2,
                textTransform: 'uppercase',
                marginBottom: 8,
              }}
            >
              About the Course
            </Text>
            <Text
              style={{
                fontFamily: 'PlayfairDisplay_700Bold',
                color: colors.neutral[800],
                fontSize: 28,
                lineHeight: 36,
                marginBottom: 16,
              }}
            >
              An Introduction to The Physical Language
            </Text>
            <Text
              style={{
                fontFamily: 'DMSans_400Regular',
                color: colors.neutral[600],
                fontSize: 16,
                lineHeight: 26,
              }}
            >
              This is an introduction to AFeeree — The Physical Language. Through this course, you will immerse yourself in the physicality of Africanist movement, exploring how the body communicates through rhythm, isolation, and dynamic expression. You will also gain meaningful insights into the research methodology that underpins AFeeree, understanding the scholarly foundations and cultural context that inform every movement principle. This course provides a foundation for dancers and teachers to begin understanding and embodying Africanist movement aesthetics. It serves as your gateway to more in-depth study and opens the path toward possible certification for those called to teach and share this practice.
            </Text>
          </View>
          <View style={{ flex: 1, minWidth: 280, maxWidth: 350, alignSelf: 'center' }}>
            <View
              style={{
                backgroundColor: colors.primary[500],
                borderRadius: 24,
                overflow: 'hidden',
              }}
            >
              <Image
                source={{ uri: 'https://images.composerapi.com/019bf7ad-8916-75b9-9874-b6c49473f082/assets/images/image_1769406156_1769406156713_019bf8d3-4fa9-7153-80c2-ff455157e01f.jpg' }}
                style={{ width: '100%', aspectRatio: 3/4, minHeight: 450 }}
                contentFit="cover"
                contentPosition="top center"
              />
              <LinearGradient
                colors={['transparent', colors.primary[600]]}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: 20,
                }}
              >
                <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', color: colors.gold[300], fontSize: 18 }}>
                  BaKari IfaSegun Lindsay
                </Text>
                <Text style={{ fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
                  Director & Legacy Keeper
                </Text>
              </LinearGradient>
            </View>
          </View>
        </View>
      </View>

      {/* Features Section */}
      <View style={{ backgroundColor: colors.neutral[100], padding: 24, paddingVertical: 60 }}>
        <Text
          style={{
            fontFamily: 'PlayfairDisplay_700Bold',
            color: colors.neutral[800],
            fontSize: 28,
            textAlign: 'center',
            marginBottom: 40,
          }}
        >
          Why Choose This Program?
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 24, justifyContent: 'center' }}>
          {features.map((feature, index) => (
            <View
              key={index}
              style={{
                backgroundColor: 'white',
                borderRadius: 16,
                padding: 24,
                width: 320,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.08,
                shadowRadius: 12,
              }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: colors.gold[100],
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                }}
              >
                <feature.icon size={28} color={colors.gold[600]} />
              </View>
              <Text
                style={{
                  fontFamily: 'DMSans_600SemiBold',
                  color: colors.neutral[800],
                  fontSize: 18,
                  marginBottom: 8,
                }}
              >
                {feature.title}
              </Text>
              <Text
                style={{
                  fontFamily: 'DMSans_400Regular',
                  color: colors.neutral[600],
                  fontSize: 14,
                  lineHeight: 22,
                }}
              >
                {feature.description}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Curriculum Preview */}
      <View style={{ padding: 24, paddingVertical: 60 }}>
        <Text
          style={{
            fontFamily: 'PlayfairDisplay_700Bold',
            color: colors.neutral[800],
            fontSize: 28,
            textAlign: 'center',
            marginBottom: 12,
          }}
        >
          Course Overview
        </Text>
        <Text
          style={{
            fontFamily: 'DMSans_400Regular',
            color: colors.neutral[500],
            fontSize: 16,
            textAlign: 'center',
            marginBottom: 40,
            maxWidth: 500,
            alignSelf: 'center',
          }}
        >
          Experience the physicality and explore the research behind AFeeree methodology
        </Text>
        <View style={{ maxWidth: 600, alignSelf: 'center', width: '100%' }}>
          {modules.map((module, index) => {
            const isExpanded = expandedIndex === index;
            return (
              <View
                key={index}
                style={{
                  backgroundColor: 'white',
                  borderRadius: 12,
                  marginBottom: 12,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  overflow: 'hidden',
                }}
              >
                <Pressable
                  onPress={() => setExpandedIndex(isExpanded ? null : index)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 16,
                  }}
                >
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: colors.primary[100],
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 16,
                    }}
                  >
                    <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.primary[600], fontSize: 14 }}>
                      {index + 1}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontFamily: 'DMSans_500Medium',
                      color: colors.neutral[800],
                      fontSize: 15,
                      flex: 1,
                    }}
                  >
                    {module.title}
                  </Text>
                  <ChevronRight
                    size={20}
                    color={colors.neutral[400]}
                    style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }}
                  />
                </Pressable>
                {isExpanded && (
                  <View style={{ paddingHorizontal: 16, paddingBottom: 16, paddingTop: 4 }}>
                    <View style={{ height: 1, backgroundColor: colors.neutral[100], marginBottom: 12 }} />
                    <Text
                      style={{
                        fontFamily: 'DMSans_400Regular',
                        color: colors.neutral[600],
                        fontSize: 14,
                        lineHeight: 22,
                      }}
                    >
                      {module.synopsis}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>

      {/* CTA Section */}
      <LinearGradient
        colors={[colors.primary[500], colors.primary[600]]}
        style={{ padding: 24, paddingVertical: 60, alignItems: 'center' }}
      >
        <Text
          style={{
            fontFamily: 'PlayfairDisplay_700Bold',
            color: colors.gold[300],
            fontSize: 28,
            textAlign: 'center',
            marginBottom: 12,
          }}
        >
          Ready to Begin Your Journey?
        </Text>
        <Text
          style={{
            fontFamily: 'DMSans_400Regular',
            color: 'rgba(255,255,255,0.85)',
            fontSize: 16,
            textAlign: 'center',
            marginBottom: 32,
            maxWidth: 500,
          }}
        >
          Experience the physical language and understand the research in preparation for more in-depth study and possible teaching certification.
        </Text>
        <Pressable
          onPress={() => router.push('/purchase')}
          style={{
            backgroundColor: colors.gold[500],
            paddingHorizontal: 40,
            paddingVertical: 18,
            borderRadius: 12,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.primary[800], fontSize: 18 }}>
            Enroll Now — $600
          </Text>
          <ArrowRight size={22} color={colors.primary[800]} style={{ marginLeft: 10 }} />
        </Pressable>
      </LinearGradient>

      {/* Footer */}
      <View style={{ backgroundColor: colors.neutral[800], padding: 24, paddingVertical: 40 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Image
            source={require('../../public/image-1769399524.png')}
            style={{ width: 32, height: 32, borderRadius: 16 }}
            contentFit="cover"
          />
          <Text
            style={{
              fontFamily: 'PlayfairDisplay_700Bold',
              color: colors.gold[400],
              fontSize: 16,
              marginLeft: 10,
            }}
          >
            AFeeree Certification
          </Text>
        </View>
        <Text
          style={{
            fontFamily: 'DMSans_400Regular',
            color: colors.neutral[400],
            fontSize: 13,
            textAlign: 'center',
          }}
        >
          © {new Date().getFullYear()} AFeeree. All rights reserved.
        </Text>

        {/* Admin Link */}
        <Pressable
          onPress={() => router.push('/admin')}
          style={{ marginTop: 20, alignItems: 'center' }}
        >
          <Text
            style={{
              fontFamily: 'DMSans_400Regular',
              color: colors.neutral[600],
              fontSize: 12,
            }}
          >
            Admin
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
