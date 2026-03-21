import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useNavigation } from 'expo-router';
import { CheckSquare, Square, FileText, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useFonts, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold } from '@expo-google-fonts/dm-sans';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { colors } from '@/lib/theme';
import { useUserStore } from '@/lib/userStore';

const TODAY = new Date().toLocaleDateString('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const CLAUSES = [
  {
    id: 'participation',
    title: '1. Participation & Consent',
    body: 'I voluntarily agree to participate in the AFeeree Certification Programme ("the Programme"), a structured course in The Physical Language developed and delivered by AFeeree Dance Arts / BaKari IfaSegun Lindsay ("AFeeree"). I understand that participation is entirely voluntary and that I may withdraw at any time without penalty, subject to the refund terms set out in Clause 9 below.',
  },
  {
    id: 'photography',
    title: '2. Photography, Video & Audio Recording',
    body: 'I grant AFeeree and its authorised representatives an irrevocable, royalty-free, worldwide licence to photograph, film, record, and otherwise capture my image, voice, and likeness during Programme sessions, workshops, demonstrations, assessments, and related events.\n\nI consent to the use of such recordings and images:\n\u2022 In educational materials, instructional videos, course content, and teaching resources;\n\u2022 In advertising, promotional, and marketing materials across all media (including print, social media, websites, and broadcast);\n\u2022 In testimonials, case studies, and programme showcases;\n\u2022 In any other lawful purpose connected with AFeeree\'s activities.\n\nI acknowledge that I will not receive financial compensation for such use and that AFeeree retains all intellectual property rights in the recordings and images.',
  },
  {
    id: 'data',
    title: '3. Data Protection & Privacy',
    body: 'AFeeree Dance Arts collects and processes the personal data you provide (including your name, email address, and programme progress) in accordance with applicable Canadian privacy legislation, including the Personal Information Protection and Electronic Documents Act (PIPEDA) and applicable provincial privacy laws.\n\nYour data will be used to:\n\u2022 Administer your enrolment and access to the Programme;\n\u2022 Track your progress and issue certification upon completion;\n\u2022 Communicate Programme updates, resources, and information;\n\u2022 Improve our teaching and programme delivery.\n\nYour data will not be sold to third parties. You have the right to access, correct, or request deletion of your personal data by contacting AFeeree Dance Arts directly.',
  },
  {
    id: 'health',
    title: '4. Health, Safety & Physical Activity',
    body: 'I acknowledge that the AFeeree Programme may involve physical movement, bodywork, and expressive physical activity. I confirm that I am in a suitable physical and mental condition to participate and that I will inform AFeeree of any relevant health conditions, injuries, or limitations prior to commencing or resuming participation.\n\nAFeeree will take reasonable steps to ensure a safe learning environment; however, I accept that participation in physical activity carries inherent risk and I agree to follow all safety guidance provided by Jeliw. I will not hold AFeeree liable for any injury arising from my failure to disclose relevant health information or to follow reasonable safety instructions.',
  },
  {
    id: 'ip',
    title: '5. Intellectual Property',
    body: 'All course materials, videos, written content, methodologies, and resources provided through the Programme are the exclusive intellectual property of AFeeree. I agree not to reproduce, distribute, sublicense, or share Programme content with any third party without the express written consent of AFeeree. Personal notes made during the Programme are for my own private study only.',
  },
  {
    id: 'certification',
    title: '6. Certification & Assessment',
    body: "Certification is awarded upon satisfactory completion of all required modules, assessments, and any practical evaluations as defined by AFeeree. AFeeree reserves the right to withhold or revoke certification where a Kalanden fails to meet the required standard, breaches this Agreement, or engages in conduct unbecoming of a certified practitioner.\n\nAFeeree's decision regarding certification is final.",
  },
  {
    id: 'conduct',
    title: '7. Code of Conduct',
    body: 'I agree to engage respectfully with all Jeliw, fellow Kalandenw, and AFeeree staff. I will not engage in discriminatory, abusive, or disruptive behaviour during Programme activities. AFeeree reserves the right to remove any Kalanden from the Programme without refund in the event of a serious breach of conduct.',
  },
  {
    id: 'confidentiality',
    title: '8. Confidentiality of Fellow Kalandenw',
    body: 'The Programme creates a shared learning space. I agree to respect the privacy and confidentiality of fellow Kalandenw. I will not record, photograph, or share information about other Kalandenw without their express consent.',
  },
  {
    id: 'refunds',
    title: '9. Payments, Refunds & Cancellations',
    body: 'Payment for the Programme (or any instalment thereof) confirms acceptance of this Agreement. Refunds are subject to AFeeree\'s current Refund Policy. In general:\n\u2022 Cancellations made more than 14 days before a Programme start date may be eligible for a full or partial refund;\n\u2022 Cancellations within 14 days of the start date are generally non-refundable;\n\u2022 Access codes and digital content become non-refundable once accessed.\n\nAFeeree reserves the right to cancel or reschedule Programme sessions due to unforeseen circumstances and will provide reasonable notice where possible.',
  },
  {
    id: 'liability',
    title: '10. Limitation of Liability',
    body: "To the fullest extent permitted by law, AFeeree's total liability to you under or in connection with this Agreement shall not exceed the total amount paid by you for the Programme. AFeeree shall not be liable for any indirect, special, or consequential loss or damage arising out of your participation in the Programme.\n\nNothing in this Agreement limits AFeeree's liability for death or personal injury caused by its own negligence, fraud, or fraudulent misrepresentation.",
  },
  {
    id: 'gender',
    title: '11. Inclusion, Diversity & Gender Identity',
    body: 'AFeeree Dance Arts is committed to creating a safe, inclusive, and affirming environment for all Kalandenw. We respect and honour every individual\'s gender identity, gender expression, sexual orientation, cultural background, ethnicity, age, ability, and lived experience.\n\nAll Kalandenw are expected to:\n\u2022 Use the names and pronouns by which fellow Kalandenw identify;\n\u2022 Refrain from making assumptions about another person\'s gender, identity, or background;\n\u2022 Engage with all Jeliw and Kalandenw in a manner that affirms their dignity and identity;\n\u2022 Immediately cease any language or behaviour identified as harmful or disrespectful by the affected individual.\n\nAny conduct that discriminates against, marginalises, or disrespects a person\'s gender identity or expression constitutes a breach of this Agreement and may result in removal from the Programme without refund.',
  },
  {
    id: 'governing',
    title: '12. Governing Law',
    body: 'This Agreement shall be governed by and construed in accordance with the laws of the Province of Ontario and the federal laws of Canada applicable therein. Any dispute arising out of or in connection with this Agreement shall be subject to the exclusive jurisdiction of the courts of Ontario, Canada.',
  },
  {
    id: 'amendments',
    title: '13. Amendments',
    body: 'AFeeree reserves the right to update this Agreement from time to time. Material changes will be communicated to Kalandenw via the app or by email. Continued participation in the Programme following notification of a change constitutes acceptance of the revised Agreement.',
  },
];

export default function AgreementScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();
  const name = useUserStore(s => s.name);
  const setOnboarded = useUserStore(s => s.setOnboarded);

  const handleClose = () => {
    if (navigation.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/');
    }
  };

  const [alreadySigned, setAlreadySigned] = useState(false);
  const [signedAt, setSignedAt] = useState('');
  const [signedName, setSignedName] = useState('');
  const [checkedClauses, setCheckedClauses] = useState<Record<string, boolean>>({});
  const [signatureName, setSignatureName] = useState('');
  const [allChecked, setAllChecked] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
  });

  useEffect(() => {
    AsyncStorage.multiGet(['agreementSigned', 'agreementSignedAt', 'agreementSignatureName']).then(pairs => {
      const signed = pairs[0][1];
      const at = pairs[1][1];
      const sigName = pairs[2][1];
      if (signed === 'true') {
        setAlreadySigned(true);
        setSignedAt(at ? new Date(at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '');
        setSignedName(sigName || '');
      }
    });
  }, []);

  const toggleClause = useCallback((id: string) => {
    Haptics.selectionAsync();
    setError('');
    setCheckedClauses(prev => {
      const updated = { ...prev, [id]: !prev[id] };
      const allNowChecked = CLAUSES.every(c => updated[c.id]);
      setAllChecked(allNowChecked);
      return updated;
    });
  }, []);

  const toggleAll = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setError('');
    if (allChecked) {
      setCheckedClauses({});
      setAllChecked(false);
    } else {
      const all: Record<string, boolean> = {};
      CLAUSES.forEach(c => { all[c.id] = true; });
      setCheckedClauses(all);
      setAllChecked(true);
    }
  }, [allChecked]);

  const handleSign = useCallback(async () => {
    if (!allChecked) {
      setError('Please read and accept all clauses before signing.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    if (signatureName.trim().length < 2) {
      setError('Please type your full name as your digital signature.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await AsyncStorage.multiSet([
      ['agreementSigned', 'true'],
      ['agreementSignedAt', new Date().toISOString()],
      ['agreementSignatureName', signatureName.trim()],
    ]);
    setOnboarded(true);
    router.replace('/(tabs)/');
  }, [allChecked, signatureName, setOnboarded, router]);

  const isValid = allChecked && signatureName.trim().length >= 2;

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream[100] }}>
      <LinearGradient
        colors={[colors.primary[600], colors.primary[500]]}
        style={{ paddingTop: insets.top, paddingBottom: 20, paddingHorizontal: 24 }}
      >
        <Animated.View entering={FadeInDown.duration(600)}>
          <Pressable
            onPress={handleClose}
            style={{ marginTop: 12, marginBottom: 4, alignSelf: 'flex-start', padding: 4 }}
          >
            <ArrowLeft size={22} color="white" />
          </Pressable>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16, marginBottom: 4 }}>
            <FileText size={18} color={colors.gold[300]} />
            <Text style={{ fontFamily: 'DMSans_500Medium', color: colors.gold[300], marginLeft: 8, fontSize: 12, letterSpacing: 2, textTransform: 'uppercase' }}>
              AFeeree Certification
            </Text>
          </View>
          <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', color: 'white', fontSize: 30 }}>
            Kalanden{' '}
            <Text style={{ fontFamily: 'DMSans_400Regular', fontStyle: 'italic', color: 'rgba(255,255,255,0.55)', fontSize: 15 }}>— Carrier of Tradition</Text>
          </Text>
          <Text style={{ fontFamily: 'DMSans_600SemiBold', color: 'rgba(255,255,255,0.8)', fontSize: 16, marginTop: 2 }}>Agreement</Text>
          <Text style={{ fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 8 }}>
            {alreadySigned
              ? 'You have already signed this agreement. Your copy is shown below.'
              : 'Please read each clause carefully and tick to confirm your acceptance before signing.'}
          </Text>
        </Animated.View>
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
          showsVerticalScrollIndicator={false}
        >
          {alreadySigned && (
            <Animated.View
              entering={FadeInUp.duration(500).delay(200)}
              style={{
                marginHorizontal: 20,
                marginTop: 20,
                padding: 16,
                borderRadius: 16,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#F0FDF4',
                borderWidth: 1,
                borderColor: '#86EFAC',
              }}
            >
              <CheckCircle2 size={22} color="#22C55E" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontFamily: 'DMSans_600SemiBold', color: '#15803D', fontSize: 14 }}>
                  Agreement Signed
                </Text>
                <Text style={{ fontFamily: 'DMSans_400Regular', color: '#166534', fontSize: 13, marginTop: 2 }}>
                  {signedName ? `Signed by ${signedName}` : 'Signed'}{signedAt ? ` on ${signedAt}` : ''}
                </Text>
              </View>
            </Animated.View>
          )}

          <Animated.View
            entering={FadeInUp.duration(500).delay(200)}
            style={{
              marginHorizontal: 20,
              marginTop: 20,
              padding: 16,
              borderRadius: 16,
              backgroundColor: colors.gold[50],
              borderWidth: 1,
              borderColor: colors.gold[200],
            }}
          >
            <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.primary[700], fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>
              Agreement Details
            </Text>
            <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[700], fontSize: 14 }}>
              <Text style={{ fontFamily: 'DMSans_600SemiBold' }}>Date: </Text>{TODAY}
            </Text>
            <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[700], fontSize: 14, marginTop: 4 }}>
              <Text style={{ fontFamily: 'DMSans_600SemiBold' }}>Kalanden: </Text>{name || '[Kalanden]'}
            </Text>
            <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[700], fontSize: 14, marginTop: 4 }}>
              <Text style={{ fontFamily: 'DMSans_600SemiBold' }}>Organisation: </Text>AFeeree Dance Arts / BaKari IfaSegun Lindsay
            </Text>
          </Animated.View>

          {!alreadySigned && (
            <Animated.View entering={FadeInUp.duration(500).delay(300)} style={{ marginHorizontal: 20, marginTop: 16 }}>
              <Pressable
                onPress={toggleAll}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 16,
                  borderRadius: 16,
                  backgroundColor: allChecked ? colors.primary[500] : 'white',
                  borderWidth: 1,
                  borderColor: allChecked ? colors.primary[500] : colors.neutral[200],
                }}
              >
                {allChecked
                  ? <CheckSquare size={22} color="white" />
                  : <Square size={22} color={colors.neutral[400]} />}
                <Text style={{ fontFamily: 'DMSans_600SemiBold', color: allChecked ? 'white' : colors.neutral[700], marginLeft: 12, fontSize: 14 }}>
                  Accept all clauses
                </Text>
              </Pressable>
            </Animated.View>
          )}

          {CLAUSES.map((clause, index) => {
            const checked = alreadySigned ? true : !!checkedClauses[clause.id];
            return (
              <Animated.View
                key={clause.id}
                entering={FadeInUp.duration(400).delay(350 + index * 40)}
                style={{ marginHorizontal: 20, marginTop: 12 }}
              >
                <View
                  style={{
                    borderRadius: 16,
                    overflow: 'hidden',
                    borderWidth: 1,
                    borderColor: checked ? colors.primary[300] : colors.neutral[200],
                    backgroundColor: checked ? colors.primary[50] : 'white',
                  }}
                >
                  <Pressable
                    onPress={() => { if (!alreadySigned) { toggleClause(clause.id); } }}
                    style={{ flexDirection: 'row', alignItems: 'flex-start', padding: 16 }}
                  >
                    <View style={{ marginTop: 2 }}>
                      {checked
                        ? <CheckSquare size={20} color={colors.primary[500]} />
                        : <Square size={20} color={colors.neutral[300]} />}
                    </View>
                    <Text style={{ fontFamily: 'DMSans_600SemiBold', color: checked ? colors.primary[600] : colors.neutral[700], flex: 1, marginLeft: 10, fontSize: 14 }}>
                      {clause.title}
                    </Text>
                  </Pressable>
                  <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                    <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[600], lineHeight: 22, fontSize: 14 }}>
                      {clause.body}
                    </Text>
                  </View>
                </View>
              </Animated.View>
            );
          })}

          {!alreadySigned && (
            <View>
              <Animated.View
                entering={FadeInUp.duration(500).delay(800)}
                style={{ marginHorizontal: 20, marginTop: 24 }}
              >
                <View
                  style={{
                    padding: 20,
                    borderRadius: 16,
                    backgroundColor: 'white',
                    borderWidth: 1.5,
                    borderColor: colors.gold[300],
                    shadowColor: colors.gold[500],
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.12,
                    shadowRadius: 12,
                    elevation: 4,
                  }}
                >
                  <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', color: colors.primary[700], fontSize: 20, marginBottom: 4 }}>
                    Digital Signature
                  </Text>
                  <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500], fontSize: 14, marginBottom: 16 }}>
                    By typing your full name below you confirm that you have read and understood this Agreement in its entirety and agree to be bound by its terms.
                  </Text>
                  <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[600], fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>
                    Full Name (as signature)
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.neutral[50], borderWidth: 1, borderColor: colors.neutral[200] }}>
                    <TextInput
                      value={signatureName}
                      onChangeText={t => { setSignatureName(t); setError(''); }}
                      placeholder={name || 'Your full name'}
                      placeholderTextColor={colors.neutral[400]}
                      autoCapitalize="words"
                      style={{
                        fontFamily: 'DMSans_400Regular',
                        color: colors.neutral[800],
                        flex: 1,
                        fontSize: 16,
                        fontStyle: signatureName ? 'italic' : 'normal',
                      }}
                    />
                  </View>
                  <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[400], fontSize: 12, marginTop: 12 }}>
                    Signed on: {TODAY}
                  </Text>
                </View>
              </Animated.View>

              {error ? (
                <Animated.View
                  entering={FadeInDown.duration(300)}
                  style={{
                    marginHorizontal: 20,
                    marginTop: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 12,
                    borderRadius: 12,
                    backgroundColor: '#FEF2F2',
                    borderWidth: 1,
                    borderColor: '#FCA5A5',
                  }}
                >
                  <AlertCircle size={16} color={colors.error} />
                  <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.error, marginLeft: 8, flex: 1, fontSize: 14 }}>
                    {error}
                  </Text>
                </Animated.View>
              ) : null}

              <Animated.View
                entering={FadeInUp.duration(500).delay(900)}
                style={{ marginHorizontal: 20, marginTop: 20 }}
              >
                <Pressable
                  onPress={handleSign}
                  style={{
                    paddingVertical: 16,
                    borderRadius: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isValid ? colors.primary[500] : colors.neutral[200],
                  }}
                >
                  <Text style={{ fontFamily: 'DMSans_600SemiBold', color: isValid ? 'white' : colors.neutral[400], fontSize: 16 }}>
                    I Agree &amp; Sign
                  </Text>
                  <Text style={{ fontFamily: 'DMSans_400Regular', color: isValid ? 'rgba(255,255,255,0.75)' : colors.neutral[400], fontSize: 12, marginTop: 2 }}>
                    Begin the Programme
                  </Text>
                </Pressable>
                <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[400], fontSize: 12, textAlign: 'center', marginTop: 16 }}>
                  This agreement is legally binding. A record of your acceptance will be stored securely within the app.
                </Text>
              </Animated.View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
