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
  Key,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import { useFonts, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold } from '@expo-google-fonts/dm-sans';

import { colors } from '@/lib/theme';

const CERTIFICATION_PHASES = [
  {
    number: '01',
    label: 'Foundation',
    subtitle: 'An Introduction to the Physical Language',
    body: 'The Foundation phase is your entry point into AFeeree\'s Physical Language. You will be introduced to the core vocabulary, concepts, and movement principles that form the bedrock of this practice. Through guided study and structured exploration, you will develop an initial understanding of the research traditions, cultural context, and pedagogical frameworks that inform AFeeree\'s approach.\n\nThis phase is designed to ground you in the fundamentals — building the awareness, curiosity, and discipline needed to advance. Completion of the Foundation phase is not a guarantee of certification; rather, it is the beginning of a journey, offering the knowledge and experience necessary to progress towards the next level of the programme.',
    accent: '#C9963C',
  },
  {
    number: '02',
    label: 'Exploration',
    subtitle: 'Deepening Into Principles and Practice',
    body: 'The Exploration phase takes you deeper into the heart of the Physical Language. You will immerse yourself in the seven core principles of AFeeree and develop a nuanced understanding of body attitude — the relationship between presence, intention, and physicality that defines this practice.\n\nThis phase introduces you to the art of teaching and creating within the language. You will begin to find your own voice, applying what you have learned in ways that are both personal and grounded in tradition. Through this process of discovery, you will develop the tools, insight, and creative capacity needed to share the Physical Language with others.',
    accent: '#7C6E5A',
  },
  {
    number: '03',
    label: 'Demonstration',
    subtitle: 'Embodying Mastery Through Teaching and Creation',
    body: 'The Demonstration phase is the culmination of your certification journey. Here, you are called upon to show mastery — to articulately teach and guide others through the Physical Language with clarity, confidence, and depth. You will create, perform, and present work that is expressive of and fully supported by AFeeree\'s principles.\n\nThis phase is not simply an assessment. It is a declaration of your readiness to carry and transmit the Physical Language as a certified practitioner. Through performance and pedagogy, you will demonstrate that the language lives not only in your body, but in your capacity to awaken it in others.',
    accent: '#3A5A4A',
  },
];

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
      synopsis: 'An overview of the AFeeree methodology and its foundational movement vocabulary. Kalandenw are introduced to the seven principles that underpin every aspect of the physical language, including polyrhythm, polycentrism, and holism.',
    },
    {
      title: 'Experiencing the Physical Language',
      synopsis: 'Hands-on exploration of Africanist movement through guided practice. Kalandenw embody the concepts by developing through the natural bends of the body, basic kata forms, and partner observation, cultivating a felt sense of the methodology.',
    },
    {
      title: 'Polyrhythmic Body Isolations',
      synopsis: 'A focused study of the body\'s ability to move multiple centres simultaneously. Exercises develop independence between the upper and lower body, training feet to hold a foundational rhythm while the torso layers additional patterns.',
    },
    {
      title: 'Understanding the Research Foundation',
      synopsis: 'An introduction to the scholarly research behind AFeeree, drawing on African aesthetics theory, ethnochoreology, and BaKari Lindsay\'s master\'s thesis. Kalandenw gain insight into how academic research informs practical movement training.',
    },
    {
      title: 'Cultural Context & Historical Framework',
      synopsis: 'An exploration of the African and Caribbean cultural traditions that shape the AFeeree aesthetic. Kalandenw examine how history, diaspora, and community inform movement practices and the responsibilities that come with teaching this work.',
    },
    {
      title: 'Preparation for Advanced Study',
      synopsis: 'A reflective session bridging introductory experience with the full Certification Program. Kalandenw review core concepts, discuss pathways toward teaching certification, and are guided on how to deepen their practice.',
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
                Introductory Course — Enrol Now
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

      {/* Certification Pathway Section */}
      <View style={{ padding: 24, paddingVertical: 60, backgroundColor: colors.primary[700] }}>
        <Text style={{ fontFamily: 'DMSans_500Medium', color: colors.gold[400], fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', textAlign: 'center', marginBottom: 8 }}>
          Your Journey
        </Text>
        <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', color: 'white', fontSize: 28, textAlign: 'center', marginBottom: 8, lineHeight: 36 }}>
          Certification Pathway
        </Text>
        <Text style={{ fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.7)', fontSize: 15, textAlign: 'center', marginBottom: 48, maxWidth: 520, alignSelf: 'center', lineHeight: 24 }}>
          Becoming a certified practitioner of the Physical Language unfolds across three distinct phases, each building on the last.
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 20, justifyContent: 'center', maxWidth: 1000, alignSelf: 'center', width: '100%' }}>
          {CERTIFICATION_PHASES.map((phase) => (
            <View
              key={phase.label}
              style={{
                backgroundColor: 'rgba(255,255,255,0.07)',
                borderRadius: 20,
                padding: 28,
                width: 300,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.12)',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: phase.accent + '30', alignItems: 'center', justifyContent: 'center', marginRight: 14, borderWidth: 1, borderColor: phase.accent + '60' }}>
                  <Text style={{ fontFamily: 'DMSans_600SemiBold', color: phase.accent, fontSize: 13, letterSpacing: 0.5 }}>{phase.number}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', color: 'white', fontSize: 18 }}>{phase.label}</Text>
                  <Text style={{ fontFamily: 'DMSans_400Regular', fontStyle: 'italic', color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 2 }}>{phase.subtitle}</Text>
                </View>
              </View>
              {phase.body.split('\n\n').map((para, pi) => (
                <Text key={pi} style={{ fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.75)', fontSize: 14, lineHeight: 22, marginBottom: pi < phase.body.split('\n\n').length - 1 ? 12 : 0 }}>
                  {para}
                </Text>
              ))}
            </View>
          ))}
        </View>

        <View style={{ marginTop: 40, padding: 20, borderRadius: 14, backgroundColor: 'rgba(201,150,60,0.15)', borderWidth: 1, borderColor: colors.gold[600] + '60', maxWidth: 600, alignSelf: 'center', width: '100%' }}>
          <Text style={{ fontFamily: 'DMSans_400Regular', fontStyle: 'italic', color: colors.gold[300], fontSize: 14, lineHeight: 22, textAlign: 'center' }}>
            Participation in the Foundation phase does not guarantee certification. Each phase represents a distinct milestone on the path toward becoming a certified practitioner of the Physical Language.
          </Text>
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
            Introductory Course — Enrol Now
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
            JELI - Keeper of the Legacy Panel
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
