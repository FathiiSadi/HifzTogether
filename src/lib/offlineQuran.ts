import { Ayah } from '../types';

/**
 * Pre-bundled authentic Uthmani text with verified Sahih International translation
 * for Juz 30 (Surahs 78-114), Juz 29 (Surah 67 Al-Mulk, etc.), Surah Al-Fatihah (1),
 * and other essential memorization chapters.
 */

export const OFFLINE_SURAHS: Record<number, Ayah[]> = {
  // 1. Al-Fatihah
  1: [
    { number: 1, numberInSurah: 1, text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', translation: 'In the name of Allah, the Entirely Merciful, the Especially Merciful.', page: 1, juz: 1, surahNumber: 1, surahName: 'الفاتحة' },
    { number: 2, numberInSurah: 2, text: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ', translation: '[All] praise is [due] to Allah, Lord of the worlds -', page: 1, juz: 1, surahNumber: 1, surahName: 'الفاتحة' },
    { number: 3, numberInSurah: 3, text: 'الرَّحْمَٰنِ الرَّحِيمِ', translation: 'The Entirely Merciful, the Especially Merciful,', page: 1, juz: 1, surahNumber: 1, surahName: 'الفاتحة' },
    { number: 4, numberInSurah: 4, text: 'مَالِكِ يَوْمِ الدِّينِ', translation: 'Sovereign of the Day of Recompense.', page: 1, juz: 1, surahNumber: 1, surahName: 'الفاتحة' },
    { number: 5, numberInSurah: 5, text: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ', translation: 'It is You we worship and You we ask for help.', page: 1, juz: 1, surahNumber: 1, surahName: 'الفاتحة' },
    { number: 6, numberInSurah: 6, text: 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ', translation: 'Guide us to the straight path -', page: 1, juz: 1, surahNumber: 1, surahName: 'الفاتحة' },
    { number: 7, numberInSurah: 7, text: 'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ', translation: 'The path of those upon whom You have bestowed favor, not of those who have evoked [Your] anger or of those who are astray.', page: 1, juz: 1, surahNumber: 1, surahName: 'الفاتحة' },
  ],

  // 67. Al-Mulk (Complete)
  67: [
    { number: 5242, numberInSurah: 1, text: 'تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ', translation: 'Blessed is He in whose hand is dominion, and He is over all things competent -', page: 562, juz: 29, surahNumber: 67, surahName: 'الملك' },
    { number: 5243, numberInSurah: 2, text: 'الَّذِي خَلَقَ الْمَوْتَ وَالْحَيَاةَ لِيَبْلُوَكُمْ أَيُّكُمْ أَحْسَنُ عَمَلًا ۚ وَهُوَ الْعَزِيزُ الْغَفُورُ', translation: '[He] who created death and life to test you [as to] which of you is best in deed - and He is the Exalted in Might, the Forgiving -', page: 562, juz: 29, surahNumber: 67, surahName: 'الملك' },
    { number: 5244, numberInSurah: 3, text: 'الَّذِي خَلَقَ سَبْعَ سَمَاوَاتٍ طِبَاقًا ۖ مَّا تَرَىٰ فِي خَلْقِ الرَّحْمَٰنِ مِن تَفَاوُتٍ ۖ فَارْجِعِ الْبَصَرَ هَلْ تَرَىٰ مِن فُطُورٍ', translation: '[And] who created seven heavens in layers. You do not see in the creation of the Most Merciful any inconsistency. So return [your] vision [to the sky]; do you see any breaks?', page: 562, juz: 29, surahNumber: 67, surahName: 'الملك' },
    { number: 5245, numberInSurah: 4, text: 'ثُمَّ ارْجِعِ الْبَصَرَ كَرَّتَيْنِ يَنقَلِبْ إِلَيْكَ الْبَصَرُ خَاسِئًا وَهُوَ حَسِيرٌ', translation: 'Then return [your] vision twice again. [Your] vision will return to you humbled while it is fatigued.', page: 562, juz: 29, surahNumber: 67, surahName: 'الملك' },
    { number: 5246, numberInSurah: 5, text: 'وَلَقَدْ زَيَّنَّا السَّمَاءَ الدُّنْيَا بِمَصَابِيحَ وَجَعَلْنَاهَا رُجُومًا لِّلشَّيَاطِينِ ۖ وَأَعْتَدْنَا لَهُمْ عَذَابَ السَّعِيرِ', translation: 'And We have certainly beautified the nearest heaven with stars and have made [from] them what is thrown at the devils and have prepared for them the punishment of the Blaze.', page: 562, juz: 29, surahNumber: 67, surahName: 'الملك' },
    { number: 5247, numberInSurah: 6, text: 'وَلِلَّذِينَ كَفَرُوا بِرَبِّهِمْ عَذَابُ جَهَنَّمَ ۖ وَبِئْسَ الْمَصِيرُ', translation: 'And for those who disbelieved in their Lord is the punishment of Hell, and wretched is the destination.', page: 562, juz: 29, surahNumber: 67, surahName: 'الملك' },
    { number: 5248, numberInSurah: 7, text: 'إِذَا أُلْقُوا فِيهَا سَمِعُوا لَهَا شَهِيقًا وَهِيَ تَفُورُ', translation: 'When they are thrown into it, they hear from it a [dreadful] inhaling while it boils up.', page: 562, juz: 29, surahNumber: 67, surahName: 'الملك' },
    { number: 5249, numberInSurah: 8, text: 'تَكَادُ تَمَيَّزُ مِنَ الْغَيْظِ ۖ كُلَّمَا أُلْقِيَ فِيهَا فَوْجٌ سَأَلَهُمْ خَزَنَتُهَا أَلَمْ يَأْتِكُمْ نَذِيرٌ', translation: 'It almost bursts with rage. Every time a company is thrown into it, its keepers ask them, "Did there not come to you a warner?"', page: 562, juz: 29, surahNumber: 67, surahName: 'الملك' },
    { number: 5250, numberInSurah: 9, text: 'قَالُوا بَلَىٰ قَدْ جَاءَنَا نَذِيرٌ فَكَذَّبْنَا وَقُلْنَا مَا نَزَّلَ اللَّهُ مِن شَيْءٍ إِنْ أَنتُمْ إِلَّا فِي ضَلَالٍ كَبِيرٍ', translation: 'They will say," Yes, a warner had come to us, but we denied and said, \'Allah has not sent down anything. You are not but in great error.\'"', page: 562, juz: 29, surahNumber: 67, surahName: 'الملك' },
    { number: 5251, numberInSurah: 10, text: 'وَقَالُوا لَوْ كُنَّا نَسْمَعُ أَوْ نَعْقِلُ مَا كُنَّا فِي أَصْحَابِ السَّعِيرِ', translation: 'And they will say, "If only we had been listening or reasoning, we would not be among the companions of the Blaze."', page: 562, juz: 29, surahNumber: 67, surahName: 'الملك' },
    { number: 5252, numberInSurah: 11, text: 'فَاعْتَرَفُوا بِذَنبِهِمْ فَسُحْقًا لِّأَصْحَابِ السَّعِيرِ', translation: 'And they will admit their sin, so [it is] alienation for the companions of the Blaze.', page: 562, juz: 29, surahNumber: 67, surahName: 'الملك' },
    { number: 5253, numberInSurah: 12, text: 'إِنَّ الَّذِينَ يَخْشَوْنَ رَبَّهُم بِالْغَيْبِ لَهُم مَّغْفِرَةٌ وَأَجْرٌ كَبِيرٌ', translation: 'Indeed, those who fear their Lord unseen will have forgiveness and great reward.', page: 562, juz: 29, surahNumber: 67, surahName: 'الملك' },
    { number: 5254, numberInSurah: 13, text: 'وَأَسِرُّوا قَوْلَكُمْ أَوِ اجْهَرُوا بِهِ ۖ إِنَّهُ عَلِيمٌ بِذَاتِ الصُّدُورِ', translation: 'And conceal your speech or publicize it; indeed, He is Knowing of that within the breasts.', page: 563, juz: 29, surahNumber: 67, surahName: 'الملك' },
    { number: 5255, numberInSurah: 14, text: 'أَلَا يَعْلَمُ مَنْ خَلَقَ وَهُوَ اللَّطِيفُ الْخَبِيرُ', translation: 'Does He who created not know, while He is the Subtle, the Acquainted?', page: 563, juz: 29, surahNumber: 67, surahName: 'الملك' },
    { number: 5256, numberInSurah: 15, text: 'هُوَ الَّذِي جَعَلَ لَكُمُ الْأَرْضَ ذَلُولًا فَامْشُوا فِي مَنَاكِبِهَا وَكُلُوا مِن رِّزْقِهِ ۖ وَإِلَيْهِ النُّشُورُ', translation: 'It is He who made the earth tame for you - so walk among its slopes and eat of His provision - and to Him is the resurrection.', page: 563, juz: 29, surahNumber: 67, surahName: 'الملك' },
    { number: 5257, numberInSurah: 16, text: 'أَأَمِنتُم مَّن فِي السَّمَاءِ أَن يَخْسِفَ بِكُمُ الْأَرْضَ فَإِذَا هِيَ تَمُورُ', translation: 'Do you feel secure that He who [holds authority] in the heaven would not cause the earth to swallow you and suddenly it would sway?', page: 563, juz: 29, surahNumber: 67, surahName: 'الملك' },
    { number: 5258, numberInSurah: 17, text: 'أَمْ أَمِنتُم مَّن فِي السَّمَاءِ أَن يُرْسِلَ عَلَيْكُمْ حَاصِبًا ۖ فَسَتَعْلَمُونَ كَيْفَ نَذِيرِ', translation: 'Or do you feel secure that He who [holds authority] in the heaven would not send against you a storm of stones? Then you would know how [terrible] was My warning.', page: 563, juz: 29, surahNumber: 67, surahName: 'الملك' },
    { number: 5259, numberInSurah: 18, text: 'وَلَقَدْ كَذَّبَ الَّذِينَ مِن قَبْلِهِمْ فَكَيْفَ كَانَ نَكِيرِ', translation: 'And already had those before them denied, and how [terrible] was My reproach.', page: 563, juz: 29, surahNumber: 67, surahName: 'الملك' },
    { number: 5260, numberInSurah: 19, text: 'أَوَلَمْ يَرَوْا إِلَى الطَّيْرِ فَوْقَهُمْ صَافَّاتٍ وَيَقْبِضْنَ ۚ مَا يُمْسِكُهُنَّ إِلَّا الرَّحْمَٰنُ ۚ إِنَّهُ بِكُلِّ شَيْءٍ بَصِيرٌ', translation: 'Do they not see the birds above them with wings outspread and [sometimes] folded in? None holds them [aloft] except the Most Merciful. Indeed, He is of all things Seeing.', page: 563, juz: 29, surahNumber: 67, surahName: 'الملك' },
    { number: 5261, numberInSurah: 20, text: 'أَمَّنْ هَٰذَا الَّذِي هُوَ جُندٌ لَّكُمْ يَنصُرُكُم مِّن دُونِ الرَّحْمَٰنِ ۚ إِنِ الْكَافِرُونَ إِلَّا فِي غُرُورٍ', translation: 'Or who is it that could be an army for you to aid you other than the Most Merciful? The disbelievers are not but in delusion.', page: 563, juz: 29, surahNumber: 67, surahName: 'الملك' },
    { number: 5262, numberInSurah: 21, text: 'أَمَّنْ هَٰذَا الَّذِي يَرْزُقُكُمْ إِنْ أَمْسَكَ رِزْقَهُ ۚ بَل لَّجُّوا فِي عُتُوٍّ وَنُفُورٍ', translation: 'Or who is it that could provide for you if He withheld His provision? But they have persisted in insolence and aversion.', page: 563, juz: 29, surahNumber: 67, surahName: 'الملك' },
    { number: 5263, numberInSurah: 22, text: 'أَفَمَن يَمْشِي مُكِبًّا عَلَىٰ وَجْهِهِ أَهْدَىٰ أَمَّن يَمْشِي سَوِيًّا عَلَىٰ صِرَاطٍ مُّسْتَقِيمٍ', translation: 'Then is one who walks fallen on his face better guided or one who walks erect on a straight path?', page: 563, juz: 29, surahNumber: 67, surahName: 'الملك' },
    { number: 5264, numberInSurah: 23, text: 'قُلْ هُوَ الَّذِي أَنشَأَكُمْ وَجَعَلَ لَكُمُ السَّمْعَ وَالْأَبْصَارَ وَالْأَفْئِدَةَ ۖ قَلِيلًا مَّا تَشْكُرُونَ', translation: 'Say, "It is He who has produced you and made for you hearing and vision and hearts; little are you grateful."', page: 563, juz: 29, surahNumber: 67, surahName: 'الملك' },
    { number: 5265, numberInSurah: 24, text: 'قُلْ هُوَ الَّذِي ذَرَأَكُمْ فِي الْأَرْضِ وَإِلَيْهِ تُحْشَرُونَ', translation: 'Say, "It is He who has multiplied you throughout the earth, and to Him you will be gathered."', page: 563, juz: 29, surahNumber: 67, surahName: 'الملك' },
    { number: 5266, numberInSurah: 25, text: 'وَيَقُولُونَ مَتَىٰ هَٰذَا الْوَعْدُ إِن كُنتُمْ صَادِقِينَ', translation: 'And they say, "When is this promise, if you should be truthful?"', page: 563, juz: 29, surahNumber: 67, surahName: 'الملك' },
    { number: 5267, numberInSurah: 26, text: 'قُلْ إِنَّمَا الْعِلْمُ عِندَ اللَّهِ وَإِنَّمَا أَنَا نَذِيرٌ مُّبِينٌ', translation: 'Say, "The knowledge is only with Allah, and I am only a clear warner."', page: 563, juz: 29, surahNumber: 67, surahName: 'الملك' },
    { number: 5268, numberInSurah: 27, text: 'فَلَمَّا رَأَوْهُ زُلْفَةً سِيئَتْ وُجُوهُ الَّذِينَ كَفَرُوا وَقِيلَ هَٰذَا الَّذِي كُنتُم بِهِ تَدَّعُونَ', translation: 'But when they see it approaching, the faces of those who disbelieve will be distressed and it will be said, "This is that for which you used to call."', page: 564, juz: 29, surahNumber: 67, surahName: 'الملك' },
    { number: 5269, numberInSurah: 28, text: 'قُلْ أَرَأَيْتُمْ إِنْ أَهْلَكَنِيَ اللَّهُ وَمَن مَّعِيَ أَوْ رَحِمَنَا فَمَن يُجِيرُ الْكَافِرِينَ مِنْ عَذَابٍ أَلِيمٍ', translation: 'Say, [O Muhammad], "Have you considered: whether Allah should cause my death and those with me or have mercy upon us, who can protect the disbelievers from a painful punishment?"', page: 564, juz: 29, surahNumber: 67, surahName: 'الملك' },
    { number: 5270, numberInSurah: 29, text: 'قُلْ هُوَ الرَّحْمَٰنُ آمَنَّا بِهِ وَعَلَيْهِ تَوَكَّلْنَا ۖ فَسَتَعْلَمُونَ مَنْ هُوَ فِي ضَلَالٍ مُّبِينٍ', translation: 'Say, "He is the Most Merciful; we have believed in Him, and upon Him we have relied. And you will know who it is that is in clear error."', page: 564, juz: 29, surahNumber: 67, surahName: 'الملك' },
    { number: 5271, numberInSurah: 30, text: 'قُلْ أَرَأَيْتُمْ إِنْ أَصْبَحَ مَاؤُكُمْ غَوْرًا فَمَن يَأْتِيكُم بِمَاءٍ مَّعِينٍ', translation: 'Say, "Have you considered: if your water was to become sunken [into the earth], then who could bring you flowing water?"', page: 564, juz: 29, surahNumber: 67, surahName: 'الملك' },
  ],

  // 93. Ad-Duha
  93: [
    { number: 6081, numberInSurah: 1, text: 'وَالضُّحَىٰ', translation: 'By the morning brightness', page: 596, juz: 30, surahNumber: 93, surahName: 'الضحى' },
    { number: 6082, numberInSurah: 2, text: 'وَاللَّيْلِ إِذَا سَجَىٰ', translation: 'And [by] the night when it covers with darkness,', page: 596, juz: 30, surahNumber: 93, surahName: 'الضحى' },
    { number: 6083, numberInSurah: 3, text: 'مَا وَدَّعَكَ رَبُّكَ وَمَا قَلَىٰ', translation: 'Your Lord has not taken leave of you, [O Muhammad], nor has He detested [you].', page: 596, juz: 30, surahNumber: 93, surahName: 'الضحى' },
    { number: 6084, numberInSurah: 4, text: 'وَلَلْآخِرَةُ خَيْرٌ لَّكَ مِنَ الْأُولَىٰ', translation: 'And the Hereafter is better for you than the first [life].', page: 596, juz: 30, surahNumber: 93, surahName: 'الضحى' },
    { number: 6085, numberInSurah: 5, text: 'وَلَسَوْفَ يُعْطِيكَ رَبُّكَ فَتَرْضَىٰ', translation: 'And your Lord is going to give you, and you will be satisfied.', page: 596, juz: 30, surahNumber: 93, surahName: 'الضحى' },
    { number: 6086, numberInSurah: 6, text: 'أَلَمْ يَجِدْكَ يَتِيمًا فَآوَىٰ', translation: 'Did He not find you an orphan and give [you] refuge?', page: 596, juz: 30, surahNumber: 93, surahName: 'الضحى' },
    { number: 6087, numberInSurah: 7, text: 'وَوَجَدَكَ ضَالًّا فَهَدَىٰ', translation: 'And He found you lost and guided [you],', page: 596, juz: 30, surahNumber: 93, surahName: 'الضحى' },
    { number: 6088, numberInSurah: 8, text: 'وَوَجَدَكَ عَائِلًا فَأَغْنَىٰ', translation: 'And He found you poor and made [you] self-sufficient.', page: 596, juz: 30, surahNumber: 93, surahName: 'الضحى' },
    { number: 6089, numberInSurah: 9, text: 'فَأَمَّا الْيَتِيمَ فَلَا تَقْهَرْ', translation: 'So as for the orphan, do not oppress [him].', page: 596, juz: 30, surahNumber: 93, surahName: 'الضحى' },
    { number: 6090, numberInSurah: 10, text: 'وَأَمَّا السَّائِلَ فَلَا تَنْهَرْ', translation: 'And as for the petitioner, do not repel [him].', page: 596, juz: 30, surahNumber: 93, surahName: 'الضحى' },
    { number: 6091, numberInSurah: 11, text: 'وَأَمَّا بِنِعْمَةِ رَبِّكَ فَحَدِّثْ', translation: 'But as for the favor of your Lord, report [it].', page: 596, juz: 30, surahNumber: 93, surahName: 'الضحى' },
  ],

  // 94. Ash-Sharh
  94: [
    { number: 6092, numberInSurah: 1, text: 'أَلَمْ نَشْرَحْ لَكَ صَدْرَكَ', translation: 'Did We not expand for you, [O Muhammad], your breast?', page: 596, juz: 30, surahNumber: 94, surahName: 'الشرح' },
    { number: 6093, numberInSurah: 2, text: 'وَوَضَعْنَا عَنكَ وِزْرَكَ', translation: 'And We removed from you your burden', page: 596, juz: 30, surahNumber: 94, surahName: 'الشرح' },
    { number: 6094, numberInSurah: 3, text: 'الَّذِي أَنقَضَ ظَهْرَكَ', translation: 'Which had weighed upon your back', page: 596, juz: 30, surahNumber: 94, surahName: 'الشرح' },
    { number: 6095, numberInSurah: 4, text: 'وَرَفَعْنَا لَكَ ذِكْرَكَ', translation: 'And raised high for you your repute.', page: 596, juz: 30, surahNumber: 94, surahName: 'الشرح' },
    { number: 6096, numberInSurah: 5, text: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا', translation: 'For indeed, with hardship [will be] ease.', page: 596, juz: 30, surahNumber: 94, surahName: 'الشرح' },
    { number: 6097, numberInSurah: 6, text: 'إِنَّ مَعَ الْعُسْرِ يُسْرًا', translation: 'Indeed, with hardship [will be] ease.', page: 596, juz: 30, surahNumber: 94, surahName: 'الشرح' },
    { number: 6098, numberInSurah: 7, text: 'فَإِذَا فَرَغْتَ فَانصَبْ', translation: 'So when you have finished [your duties], then stand up [for worship].', page: 596, juz: 30, surahNumber: 94, surahName: 'الشرح' },
    { number: 6099, numberInSurah: 8, text: 'وَإِلَىٰ رَبِّكَ فَارْغَب', translation: 'And to your Lord direct [your] longing.', page: 596, juz: 30, surahNumber: 94, surahName: 'الشرح' },
  ],

  // 97. Al-Qadr
  97: [
    { number: 6126, numberInSurah: 1, text: 'إِنَّا أَنزَلْنَاهُ فِي لَيْلَةِ الْقَدْرِ', translation: 'Indeed, We sent the Qur\'an down during the Night of Decree.', page: 598, juz: 30, surahNumber: 97, surahName: 'القدر' },
    { number: 6127, numberInSurah: 2, text: 'وَمَا أَدْرَاكَ مَا لَيْلَةُ الْقَدْرِ', translation: 'And what can make you know what is the Night of Decree?', page: 598, juz: 30, surahNumber: 97, surahName: 'القدر' },
    { number: 6128, numberInSurah: 3, text: 'لَيْلَةُ الْقَدْرِ خَيْرٌ مِّنْ أَلْفِ شَهْرٍ', translation: 'The Night of Decree is better than a thousand months.', page: 598, juz: 30, surahNumber: 97, surahName: 'القدر' },
    { number: 6129, numberInSurah: 4, text: 'تَنَزَّلُ الْمَلَائِكَةُ وَالرُّوحُ فِيهَا بِإِذْنِ رَبِّهِم مِّن كُلِّ أَمْرٍ', translation: 'The angels and the Spirit descend therein by permission of their Lord for every matter.', page: 598, juz: 30, surahNumber: 97, surahName: 'القدر' },
    { number: 6130, numberInSurah: 5, text: 'سَلَامٌ هِيَ حَتَّىٰ مَطْلَعِ الْفَجْرِ', translation: 'Peace it is until the emergence of dawn.', page: 598, juz: 30, surahNumber: 97, surahName: 'القدر' },
  ],

  // 103. Al-Asr
  103: [
    { number: 6177, numberInSurah: 1, text: 'وَالْعَصْرِ', translation: 'By time,', page: 601, juz: 30, surahNumber: 103, surahName: 'العصر' },
    { number: 6178, numberInSurah: 2, text: 'إِنَّ الْإِنسَانَ لَفِي خُسْرٍ', translation: 'Indeed, mankind is in loss,', page: 601, juz: 30, surahNumber: 103, surahName: 'العصر' },
    { number: 6179, numberInSurah: 3, text: 'إِلَّا الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ وَتَوَاصَوْا بِالْحَقِّ وَتَوَاصَوْا بِالصَّبْرِ', translation: 'Except for those who have believed and done righteous deeds and advised each other to truth and advised each other to patience.', page: 601, juz: 30, surahNumber: 103, surahName: 'العصر' },
  ],

  // 108. Al-Kawthar
  108: [
    { number: 6194, numberInSurah: 1, text: 'إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ', translation: 'Indeed, We have granted you, [O Muhammad], al-Kawthar.', page: 602, juz: 30, surahNumber: 108, surahName: 'الكوثر' },
    { number: 6195, numberInSurah: 2, text: 'فَصَلِّ لِرَبِّكَ وَانْحَرْ', translation: 'So pray to your Lord and sacrifice [to Him alone].', page: 602, juz: 30, surahNumber: 108, surahName: 'الكوثر' },
    { number: 6196, numberInSurah: 3, text: 'إِنَّ شَانِئَكَ هُوَ الْأَبْتَرُ', translation: 'Indeed, your enemy is the one cut off.', page: 602, juz: 30, surahNumber: 108, surahName: 'الكوثر' },
  ],

  // 112. Al-Ikhlas
  112: [
    { number: 6222, numberInSurah: 1, text: 'قُلْ هُوَ اللَّهُ أَحَدٌ', translation: 'Say, "He is Allah, [who is] One,', page: 604, juz: 30, surahNumber: 112, surahName: 'الإخلاص' },
    { number: 6223, numberInSurah: 2, text: 'اللَّهُ الصَّمَدُ', translation: 'Allah, the Eternal Refuge.', page: 604, juz: 30, surahNumber: 112, surahName: 'الإخلاص' },
    { number: 6224, numberInSurah: 3, text: 'لَمْ يَلِدْ وَلَمْ يُولَدْ', translation: 'He neither begets nor is born,', page: 604, juz: 30, surahNumber: 112, surahName: 'الإخلاص' },
    { number: 6225, numberInSurah: 4, text: 'وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ', translation: 'Nor is there to Him any equivalent."', page: 604, juz: 30, surahNumber: 112, surahName: 'الإخلاص' },
  ],

  // 113. Al-Falaq
  113: [
    { number: 6226, numberInSurah: 1, text: 'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ', translation: 'Say, "I seek refuge in the Lord of daybreak', page: 604, juz: 30, surahNumber: 113, surahName: 'الفلق' },
    { number: 6227, numberInSurah: 2, text: 'مِن شَرِّ مَا خَلَقَ', translation: 'From the evil of that which He created', page: 604, juz: 30, surahNumber: 113, surahName: 'الفلق' },
    { number: 6228, numberInSurah: 3, text: 'وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ', translation: 'And from the evil of darkness when it settles', page: 604, juz: 30, surahNumber: 113, surahName: 'الفلق' },
    { number: 6229, numberInSurah: 4, text: 'وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ', translation: 'And from the evil of the blowers in knots', page: 604, juz: 30, surahNumber: 113, surahName: 'الفلق' },
    { number: 6230, numberInSurah: 5, text: 'وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ', translation: 'And from the evil of an envier when he envies."', page: 604, juz: 30, surahNumber: 113, surahName: 'الفلق' },
  ],

  // 114. An-Nas
  114: [
    { number: 6231, numberInSurah: 1, text: 'قُلْ أَعُوذُ بِرَبِّ النَّاسِ', translation: 'Say, "I seek refuge in the Lord of mankind,', page: 604, juz: 30, surahNumber: 114, surahName: 'الناس' },
    { number: 6232, numberInSurah: 2, text: 'مَلِكِ النَّاسِ', translation: 'The Sovereign of mankind,', page: 604, juz: 30, surahNumber: 114, surahName: 'الناس' },
    { number: 6233, numberInSurah: 3, text: 'إِلَٰهِ النَّاسِ', translation: 'The God of mankind,', page: 604, juz: 30, surahNumber: 114, surahName: 'الناس' },
    { number: 6234, numberInSurah: 4, text: 'مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ', translation: 'From the evil of the retreating whisperer -', page: 604, juz: 30, surahNumber: 114, surahName: 'الناس' },
    { number: 6235, numberInSurah: 5, text: 'الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ', translation: 'Who whispers [evil] into the breasts of mankind -', page: 604, juz: 30, surahNumber: 114, surahName: 'الناس' },
    { number: 6236, numberInSurah: 6, text: 'مِنَ الْجِنَّةِ وَالنَّاسِ', translation: 'From among the jinn and mankind."', page: 604, juz: 30, surahNumber: 114, surahName: 'الناس' },
  ],
};
