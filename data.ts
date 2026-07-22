
import { Pet, Owner, CityData, AreaData } from './types';

export const CITIES_DATA: CityData[] = [
  {
    en: "Cairo",
    ar: "القاهرة",
    areas: [
      { en: "15 May", ar: "15 مايو" }, { en: "Al Azbakeyah", ar: "الازبكية" }, { en: "Al Basatin", ar: "البساتين" },
      { en: "Tebin", ar: "التبين" }, { en: "El-Khalifa", ar: "الخليفة" }, { en: "El darrasa", ar: "الدراسة" },
      { en: "Aldarb Alahmar", ar: "الدرب الاحمر" }, { en: "Zawya al-Hamra", ar: "الزاوية الحمراء" }, { en: "El-Zaytoun", ar: "الزيتون" },
      { en: "Sahel", ar: "الساحل" }, { en: "El Salam", ar: "السلام" }, { en: "Sayeda Zeinab", ar: "السيدة زينب" },
      { en: "El Sharabeya", ar: "الشرابية" }, { en: "Shorouk", ar: "مدينة الشروق" }, { en: "El Daher", ar: "الظاهر" },
      { en: "Ataba", ar: "العتبة" }, { en: "New Cairo", ar: "القاهرة الجديدة" }, { en: "El Marg", ar: "المرج" },
      { en: "Ezbet el Nakhl", ar: "عزبة النخل" }, { en: "Matareya", ar: "المطرية" }, { en: "Maadi", ar: "المعادى" },
      { en: "Maasara", ar: "المعصرة" }, { en: "Mokattam", ar: "المقطم" }, { en: "Manyal", ar: "المنيل" },
      { en: "Mosky", ar: "الموسكى" }, { en: "Nozha", ar: "النزهة" }, { en: "Waily", ar: "الوايلى" },
      { en: "Bab al-Shereia", ar: "باب الشعرية" }, { en: "Bolaq", ar: "بولاق" }, { en: "Garden City", ar: "جاردن سيتى" },
      { en: "Hadayek El-Kobba", ar: "حدائق القبة" }, { en: "Helwan", ar: "حلوان" }, { en: "Dar Al Salam", ar: "دار السلام" },
      { en: "Shubra", ar: "شبرا" }, { en: "Tura", ar: "طره" }, { en: "Abdeen", ar: "عابدين" },
      { en: "Abaseya", ar: "عباسية" }, { en: "Ain Shams", ar: "عين شمس" }, { en: "Nasr City", ar: "مدينة نصر" },
      { en: "New Heliopolis", ar: "مصر الجديدة" }, { en: "Masr Al Qadima", ar: "مصر القديمة" }, { en: "Mansheya Nasir", ar: "منشية ناصر" },
      { en: "Badr City", ar: "مدينة بدر" }, { en: "Obour City", ar: "مدينة العبور" }, { en: "Cairo Downtown", ar: "وسط البلد" },
      { en: "Zamalek", ar: "الزمالك" }, { en: "Kasr El Nile", ar: "قصر النيل" }, { en: "Rehab", ar: "الرحاب" },
      { en: "Katameya", ar: "القطامية" }, { en: "Madinty", ar: "مدينتي" }, { en: "Rod Alfarag", ar: "روض الفرج" },
      { en: "Sheraton", ar: "شيراتون" }, { en: "El-Gamaleya", ar: "الجمالية" }, { en: "10th of Ramadan City", ar: "العاشر من رمضان" },
      { en: "Helmeyat Alzaytoun", ar: "الحلمية" }, { en: "New Nozha", ar: "النزهة الجديدة" }, { en: "Capital New", ar: "العاصمة الإدارية" }
    ]
  },
  {
    en: "Giza",
    ar: "الجيزة",
    areas: [
      { en: "Giza", ar: "الجيزة" }, { en: "Sixth of October", ar: "السادس من أكتوبر" }, { en: "Cheikh Zayed", ar: "الشيخ زايد" },
      { en: "Hawamdiyah", ar: "الحوامدية" }, { en: "Al Badrasheen", ar: "البدرشين" }, { en: "Saf", ar: "الصف" },
      { en: "Atfih", ar: "أطفيح" }, { en: "Al Ayat", ar: "العياط" }, { en: "Al-Bawaiti", ar: "الباويطي" },
      { en: "ManshiyetAl Qanater", ar: "منشأة القناطر" }, { en: "Oaseem", ar: "أوسيم" }, { en: "Kerdasa", ar: "كرداسة" },
      { en: "Abu Nomros", ar: "أبو النمرس" }, { en: "Kafr Ghati", ar: "كفر غطاطي" }, { en: "Manshiyet Al Bakari", ar: "منشأة البكاري" },
      { en: "Dokki", ar: "الدقى" }, { en: "Agouza", ar: "العجوزة" }, { en: "Haram", ar: "الهرم" },
      { en: "Warraq", ar: "الوراق" }, { en: "Imbaba", ar: "امبابة" }, { en: "Boulaq Dakrour", ar: "بولاق الدكرور" },
      { en: "Al Wahat Al Baharia", ar: "الواحات البحرية" }, { en: "Omraneya", ar: "العمرانية" }, { en: "Moneeb", ar: "المنيب" },
      { en: "Bin Alsarayat", ar: "بين السرايات" }, { en: "Kit Kat", ar: "الكيت كات" }, { en: "Mohandessin", ar: "المهندسين" },
      { en: "Faisal", ar: "فيصل" }, { en: "Abu Rawash", ar: "أبو رواش" }, { en: "Hadayek Alahram", ar: "حدائق الأهرام" },
      { en: "Haraneya", ar: "الحرانية" }, { en: "Hadayek October", ar: "حدائق اكتوبر" }, { en: "Saft Allaban", ar: "صفط اللبن" },
      { en: "Smart Village", ar: "القرية الذكية" }, { en: "Ard Ellwaa", ar: "ارض اللواء" }
    ]
  },
  {
    en: "Alexandria",
    ar: "الأسكندرية",
    areas: [
      { en: "Abu Qir", ar: "ابو قير" }, { en: "Al Ibrahimeyah", ar: "الابراهيمية" }, { en: "Azarita", ar: "الأزاريطة" },
      { en: "Anfoushi", ar: "الانفوشى" }, { en: "Dekheila", ar: "الدخيلة" }, { en: "El Soyof", ar: "السيوف" },
      { en: "Ameria", ar: "العامرية" }, { en: "El Labban", ar: "اللبان" }, { en: "Al Mafrouza", ar: "المفروزة" },
      { en: "El Montaza", ar: "المنتزه" }, { en: "Mansheya", ar: "المنشية" }, { en: "Naseria", ar: "الناصرية" },
      { en: "Ambrozo", ar: "امبروزو" }, { en: "Bab Sharq", ar: "باب شرق" }, { en: "Bourj Alarab", ar: "برج العرب" },
      { en: "Stanley", ar: "ستانلى" }, { en: "Smouha", ar: "سموحة" }, { en: "Sidi Bishr", ar: "سيدى بشر" },
      { en: "Shads", ar: "شدس" }, { en: "Gheet Alenab", ar: "غيط العنب" }, { en: "Fleming", ar: "فلمينج" },
      { en: "Victoria", ar: "فيكتوريا" }, { en: "Camp Shizar", ar: "كامب شيزار" }, { en: "Karmooz", ar: "كرموز" },
      { en: "Mahta Alraml", ar: "محطة الرمل" }, { en: "Mina El-Basal", ar: "مينا البصل" }, { en: "Asafra", ar: "العصافرة" },
      { en: "Agamy", ar: "العجمي" }, { en: "Bakos", ar: "بكوس" }, { en: "Boulkly", ar: "بولكلي" },
      { en: "Cleopatra", ar: "كليوباترا" }, { en: "Glim", ar: "جليم" }, { en: "Al Mamurah", ar: "المعمورة" },
      { en: "Al Mandara", ar: "المندرة" }, { en: "Moharam Bek", ar: "محرم بك" }, { en: "Elshatby", ar: "الشاطبي" },
      { en: "Sidi Gaber", ar: "سيدي جابر" }, { en: "North Coast/sahel", ar: "الساحل الشمالي" }, { en: "Alhadra", ar: "الحضرة" },
      { en: "Alattarin", ar: "العطارين" }, { en: "Sidi Kerir", ar: "سيدي كرير" }, { en: "Elgomrok", ar: "الجمرك" },
      { en: "Al Max", ar: "المكس" }, { en: "Marina", ar: "مارينا" }
    ]
  },
  {
    en: "Dakahlia",
    ar: "الدقهلية",
    areas: [
      { en: "Mansoura", ar: "المنصورة" }, { en: "Talkha", ar: "طلخا" }, { en: "Mitt Ghamr", ar: "ميت غمر" },
      { en: "Dekernes", ar: "دكرنس" }, { en: "Aga", ar: "أجا" }, { en: "Menia El Nasr", ar: "منية النصر" },
      { en: "Sinbillawin", ar: "السنبلاوين" }, { en: "El Kurdi", ar: "الكردي" }, { en: "Bani Ubaid", ar: "بني عبيد" },
      { en: "Al Manzala", ar: "المنزلة" }, { en: "tami al'amdid", ar: "تمي الأمديد" }, { en: "aljamalia", ar: "الجمالية" },
      { en: "Sherbin", ar: "شربين" }, { en: "Mataria", ar: "المطرية" }, { en: "Belqas", ar: "بلقاس" },
      { en: "Meet Salsil", ar: "ميت سلسيل" }, { en: "Gamasa", ar: "جمصة" }, { en: "Mahalat Damana", ar: "محلة دمنة" },
      { en: "Nabroh", ar: "نبروه" }
    ]
  },
  {
    en: "Red Sea",
    ar: "البحر الأحمر",
    areas: [
      { en: "Hurghada", ar: "الغردقة" }, { en: "Ras Ghareb", ar: "رأس غارب" }, { en: "Safaga", ar: "سفاجا" },
      { en: "El Qusiar", ar: "القصير" }, { en: "Marsa Alam", ar: "مرسى علم" }, { en: "Shalatin", ar: "الشلاتين" },
      { en: "Halaib", ar: "حلايب" }, { en: "Aldahar", ar: "الدهار" }
    ]
  },
  {
    en: "Beheira",
    ar: "البحيرة",
    areas: [
      { en: "Damanhour", ar: "دمنهور" }, { en: "Kafr El Dawar", ar: "كفر الدوار" }, { en: "Rashid", ar: "رشيد" },
      { en: "Edco", ar: "إدكو" }, { en: "Abu al-Matamir", ar: "أبو المطامير" }, { en: "Abu Homs", ar: "أبو حمص" },
      { en: "Delengat", ar: "الدلنجات" }, { en: "Mahmoudiyah", ar: "المحمودية" }, { en: "Rahmaniyah", ar: "الرحمانية" },
      { en: "Itai Baroud", ar: "إيتاي البارود" }, { en: "Housh Eissa", ar: "حوش عيسى" }, { en: "Shubrakhit", ar: "شبراخيت" },
      { en: "Kom Hamada", ar: "كوم حمادة" }, { en: "Badr", ar: "بدر" }, { en: "Wadi Natrun", ar: "وادي النطرون" },
      { en: "New Nubaria", ar: "النوبارية الجديدة" }, { en: "Alnoubareya", ar: "النوبارية" }
    ]
  },
  {
    en: "Fayoum",
    ar: "الفيوم",
    areas: [
      { en: "Fayoum", ar: "الفيوم" }, { en: "Fayoum El Gedida", ar: "الفيوم الجديدة" }, { en: "Tamiya", ar: "طامية" },
      { en: "Snores", ar: "سنورس" }, { en: "Etsa", ar: "إطسا" }, { en: "Epschway", ar: "إبشواي" },
      { en: "Yusuf El Sediaq", ar: "يوسف الصديق" }, { en: "Hadqa", ar: "الحادقة" }, { en: "Atsa", ar: "اطسا" },
      { en: "Algamaa", ar: "الجامعة" }, { en: "Sayala", ar: "السيالة" }
    ]
  },
  {
    en: "Gharbiya",
    ar: "الغربية",
    areas: [
      { en: "Tanta", ar: "طنطا" }, { en: "Al Mahalla Al Kobra", ar: "المحلة الكبرى" }, { en: "Kafr El Zayat", ar: "كفر الزيات" },
      { en: "Zefta", ar: "زفتى" }, { en: "El Santa", ar: "السنطة" }, { en: "Qutour", ar: "قطور" },
      { en: "Basion", ar: "بسيون" }, { en: "Samannoud", ar: "سمنود" }
    ]
  },
  {
    en: "Ismailia",
    ar: "الإسماعلية",
    areas: [
      { en: "Ismailia", ar: "الإسماعيلية" }, { en: "Fayed", ar: "فايد" }, { en: "Qantara Sharq", ar: "القنطرة شرق" },
      { en: "Qantara Gharb", ar: "القنطرة غرب" }, { en: "El Tal El Kabier", ar: "التل الكبير" }, { en: "Abu Sawir", ar: "أبو صوير" },
      { en: "Kasasien El Gedida", ar: "القصاصين الجديدة" }, { en: "Nefesha", ar: "نفيشة" }, { en: "Sheikh Zayed", ar: "الشيخ زايد" }
    ]
  },
  {
    en: "Menofia",
    ar: "المنوفية",
    areas: [
      { en: "Shbeen El Koom", ar: "شبين الكوم" }, { en: "Sadat City", ar: "مدينة السادات" }, { en: "Menouf", ar: "منوف" },
      { en: "Sars El-Layan", ar: "سرس الليان" }, { en: "Ashmon", ar: "أشمون" }, { en: "Al Bagor", ar: "الباجور" },
      { en: "Quesna", ar: "قويسنا" }, { en: "Berkat El Saba", ar: "بركة السبع" }, { en: "Tala", ar: "تلا" },
      { en: "Al Shohada", ar: "الشهداء" }
    ]
  },
  {
    en: "Minya",
    ar: "المنيا",
    areas: [
      { en: "Minya", ar: "المنيا" }, { en: "Minya El Gedida", ar: "المنيا الجديدة" }, { en: "El Adwa", ar: "العدوة" },
      { en: "Magagha", ar: "مغاغة" }, { en: "Bani Mazar", ar: "بني مزار" }, { en: "Mattay", ar: "مطاي" },
      { en: "Samalut", ar: "سمالوط" }, { en: "Madinat El Fekria", ar: "المدينة الفكرية" }, { en: "Meloy", ar: "ملوي" },
      { en: "Deir Mawas", ar: "دير مواس" }, { en: "Abu Qurqas", ar: "ابو قرقاص" }, { en: "Ard Sultan", ar: "ارض سلطان" }
    ]
  },
  {
    en: "Qaliubiya",
    ar: "القليوبية",
    areas: [
      { en: "Banha", ar: "بنها" }, { en: "Qalyub", ar: "قليوب" }, { en: "Shubra Al Khaimah", ar: "شبرا الخيمة" },
      { en: "Al Qanater Charity", ar: "القناطر الخيرية" }, { en: "Khanka", ar: "الخانكة" }, { en: "Kafr Shukr", ar: "كفر شكر" },
      { en: "Tukh", ar: "طوخ" }, { en: "Qaha", ar: "قها" }, { en: "Obour", ar: "العبور" },
      { en: "Khosous", ar: "الخصوص" }, { en: "Shibin Al Qanater", ar: "شبين القناطر" }, { en: "Mostorod", ar: "مسطرد" }
    ]
  },
  {
    en: "New Valley",
    ar: "الوادي الجديد",
    areas: [
      { en: "El Kharga", ar: "الخارجة" }, { en: "Paris", ar: "باريس" }, { en: "Mout", ar: "موط" },
      { en: "Farafra", ar: "الفرافرة" }, { en: "Balat", ar: "بلاط" }, { en: "Dakhla", ar: "الداخلة" }
    ]
  },
  {
    en: "Suez",
    ar: "السويس",
    areas: [
      { en: "Suez", ar: "السويس" }, { en: "Alganayen", ar: "الجناين" }, { en: "Ataqah", ar: "عتاقة" },
      { en: "Ain Sokhna", ar: "العين السخنة" }, { en: "Faysal", ar: "فيصل" }
    ]
  },
  {
    en: "Aswan",
    ar: "اسوان",
    areas: [
      { en: "Aswan", ar: "أسوان" }, { en: "Aswan El Gedida", ar: "أسوان الجديدة" }, { en: "Drau", ar: "دراو" },
      { en: "Kom Ombo", ar: "كوم أمبو" }, { en: "Nasr Al Nuba", ar: "نصر النوبة" }, { en: "Kalabsha", ar: "كلابشة" },
      { en: "Edfu", ar: "إدفو" }, { en: "Al-Radisiyah", ar: "الرديسية" }, { en: "Al Basilia", ar: "البصيلية" },
      { en: "Al Sibaeia", ar: "السباعية" }, { en: "Abo Simbl Al Siyahia", ar: "ابوسمبل السياحية" }, { en: "Marsa Alam", ar: "مرسى علم" }
    ]
  },
  {
    en: "Assiut",
    ar: "اسيوط",
    areas: [
      { en: "Assiut", ar: "أسيوط" }, { en: "Assiut El Gedida", ar: "أسيوط الجديدة" }, { en: "Dayrout", ar: "ديروط" },
      { en: "Manfalut", ar: "منفلوط" }, { en: "Qusiya", ar: "القوصية" }, { en: "Abnoub", ar: "أبنوب" },
      { en: "Abu Tig", ar: "أبو تيج" }, { en: "El Ghanaim", ar: "الغنايم" }, { en: "Sahel Selim", ar: "ساحل سليم" },
      { en: "El Badari", ar: "البداري" }, { en: "Sidfa", ar: "صدفا" }
    ]
  },
  {
    en: "Beni Suef",
    ar: "بني سويف",
    areas: [
      { en: "Bani Sweif", ar: "بني سويف" }, { en: "Beni Suef El Gedida", ar: "بني سويف الجديدة" }, { en: "Al Wasta", ar: "الواسطى" },
      { en: "Naser", ar: "ناصر" }, { en: "Ehnasia", ar: "إهناسيا" }, { en: "beba", ar: "ببا" },
      { en: "Fashn", ar: "الفشن" }, { en: "Somasta", ar: "سمسطا" }, { en: "Alabbaseri", ar: "الاباصيرى" },
      { en: "Mokbel", ar: "مقبل" }
    ]
  },
  {
    en: "Port Said",
    ar: "بورسعيد",
    areas: [
      { en: "PorSaid", ar: "بورسعيد" }, { en: "Port Fouad", ar: "بورفؤاد" }, { en: "Alarab", ar: "العرب" },
      { en: "Zohour", ar: "حى الزهور" }, { en: "Alsharq", ar: "حى الشرق" }, { en: "Aldawahi", ar: "حى الضواحى" },
      { en: "Almanakh", ar: "حى المناخ" }, { en: "Mubarak", ar: "حى مبارك" }
    ]
  },
  {
    en: "Damietta",
    ar: "دمياط",
    areas: [
      { en: "Damietta", ar: "دمياط" }, { en: "New Damietta", ar: "دمياط الجديدة" }, { en: "Ras El Bar", ar: "رأس البر" },
      { en: "Faraskour", ar: "فارسكور" }, { en: "Zarqa", ar: "الزرقا" }, { en: "alsaru", ar: "السرو" },
      { en: "alruwda", ar: "الروضة" }, { en: "Kafr El-Batikh", ar: "كفر البطيخ" }, { en: "Azbet Al Burg", ar: "عزبة البرج" },
      { en: "Meet Abou Ghalib", ar: "ميت أبو غالب" }, { en: "Kafr Saad", ar: "كفر سعد" }
    ]
  },
  {
    en: "Sharkia",
    ar: "الشرقية",
    areas: [
      { en: "Zagazig", ar: "الزقازيق" }, { en: "Al Ashr Men Ramadan", ar: "العاشر من رمضان" }, { en: "Minya Al Qamh", ar: "منيا القمح" },
      { en: "Belbeis", ar: "بلبيس" }, { en: "Mashtoul El Souq", ar: "مشتول السوق" }, { en: "Qenaiat", ar: "القنايات" },
      { en: "Abu Hammad", ar: "أبو حماد" }, { en: "El Qurain", ar: "القرين" }, { en: "Hehia", ar: "ههيا" },
      { en: "Abu Kabir", ar: "أبو كبير" }, { en: "Faccus", ar: "فاقوس" }, { en: "El Salihia El Gedida", ar: "الصالحية الجديدة" },
      { en: "Al Ibrahimiyah", ar: "الإبراهيمية" }, { en: "Deirb Negm", ar: "ديرب نجم" }, { en: "Kafr Saqr", ar: "كفر صقر" },
      { en: "Awlad Saqr", ar: "أولاد صقر" }, { en: "Husseiniya", ar: "الحسينية" }, { en: "san alhajar alqablia", ar: "صان الحجر القبلية" },
      { en: "Manshayat Abu Omar", ar: "منشأة أبو عمر" }
    ]
  },
  {
    en: "South Sinai",
    ar: "جنوب سيناء",
    areas: [
      { en: "Al Toor", ar: "الطور" }, { en: "Sharm El-Shaikh", ar: "شرم الشيخ" }, { en: "Dahab", ar: "دهب" },
      { en: "Nuweiba", ar: "نويبع" }, { en: "Taba", ar: "طابا" }, { en: "Saint Catherine", ar: "سانت كاترين" },
      { en: "Abu Redis", ar: "أبو رديس" }, { en: "Abu Zenaima", ar: "أبو زنيمة" }, { en: "Ras Sidr", ar: "رأس سدر" }
    ]
  },
  {
    en: "Kafr Al sheikh",
    ar: "كفر الشيخ",
    areas: [
      { en: "Kafr El Sheikh", ar: "كفر الشيخ" }, { en: "Kafr El Sheikh Downtown", ar: "وسط البلد كفر الشيخ" }, { en: "Desouq", ar: "دسوق" },
      { en: "Fooh", ar: "فوه" }, { en: "Metobas", ar: "مطوبس" }, { en: "Burg Al Burullus", ar: "برج البرلس" },
      { en: "Baltim", ar: "بلطيم" }, { en: "Masief Baltim", ar: "مصيف بلطيم" }, { en: "Hamol", ar: "الحامول" },
      { en: "Bella", ar: "بيلا" }, { en: "Riyadh", ar: "الرياض" }, { en: "Sidi Salm", ar: "سيدي سالم" },
      { en: "Qellen", ar: "قلين" }, { en: "Sidi Ghazi", ar: "سيدي غازي" }
    ]
  },
  {
    en: "Matrouh",
    ar: "مطروح",
    areas: [
      { en: "Marsa Matrouh", ar: "مرسى مطروح" }, { en: "El Hamam", ar: "الحمام" }, { en: "Alamein", ar: "العلمين" },
      { en: "Dabaa", ar: "الضبعة" }, { en: "Al-Nagila", ar: "النجيلة" }, { en: "Sidi Brani", ar: "سيدي براني" },
      { en: "Salloum", ar: "السلوم" }, { en: "Siwa", ar: "سيوة" }, { en: "Marina", ar: "مارينا" },
      { en: "North Coast", ar: "الساحل الشمالى" }
    ]
  },
  {
    en: "Luxor",
    ar: "الأقصر",
    areas: [
      { en: "Luxor", ar: "الأقصر" }, { en: "New Luxor", ar: "الأقصر الجديدة" }, { en: "Esna", ar: "إسنا" },
      { en: "New Tiba", ar: "طيبة الجديدة" }, { en: "Al ziynia", ar: "الزينية" }, { en: "Al Bayadieh", ar: "البياضية" },
      { en: "Al Qarna", ar: "القرنة" }, { en: "Armant", ar: "أرمنت" }, { en: "Al Tud", ar: "الطود" }
    ]
  },
  {
    en: "Qena",
    ar: "قنا",
    areas: [
      { en: "Qena", ar: "قنا" }, { en: "New Qena", ar: "قنا الجديدة" }, { en: "Abu Tesht", ar: "ابو طشت" },
      { en: "Nag Hammadi", ar: "نجع حمادي" }, { en: "Deshna", ar: "دشنا" }, { en: "Alwaqf", ar: "الوقف" },
      { en: "Qaft", ar: "قفط" }, { en: "Naqada", ar: "نقادة" }, { en: "Farshout", ar: "فرشوت" },
      { en: "Quos", ar: "قوص" }
    ]
  },
  {
    en: "North Sinai",
    ar: "شمال سيناء",
    areas: [
      { en: "Arish", ar: "العريش" }, { en: "Sheikh Zowaid", ar: "الشيخ زويد" }, { en: "Nakhl", ar: "نخل" },
      { en: "Rafah", ar: "رفح" }, { en: "Bir al-Abed", ar: "بئر العبد" }, { en: "Al Hasana", ar: "الحسنة" }
    ]
  },
  {
    en: "Sohag",
    ar: "سوهاج",
    areas: [
      { en: "Sohag", ar: "سوهاج" }, { en: "Sohag El Gedida", ar: "سوهاج الجديدة" }, { en: "Akhmeem", ar: "أخميم" },
      { en: "Akhmim El Gedida", ar: "أخميم الجديدة" }, { en: "Albalina", ar: "البلينا" }, { en: "El Maragha", ar: "المراغة" },
      { en: "almunsha'a", ar: "المنشأة" }, { en: "Dar AISalaam", ar: "دار السلام" }, { en: "Gerga", ar: "جرجا" },
      { en: "Jahina Al Gharbia", ar: "جهينة الغربية" }, { en: "Saqilatuh", ar: "ساقلته" }, { en: "Tama", ar: "طما" },
      { en: "Tahta", ar: "طهطا" }, { en: "Alkawthar", ar: "الكوثر" }
    ]
  }
];

export const DOG_BREEDS = [
  { en: 'Affenpinscher', ar: 'أفينبينشر' }, { en: 'Akita', ar: 'أكيتا' }, { en: 'Alaskan Malamute', ar: 'ألاسكَن ملاميوت' },
  { en: 'American Bulldog', ar: 'أمريكَن بولدوغ' }, { en: 'American Cocker Spaniel', ar: 'أمريكَن كوكر سبانيَل' },
  { en: 'American Eskimo Dog', ar: 'أمريكَن إسكيمو دوق' }, { en: 'American Pit Bull Terrier', ar: 'أمريكَن بيت بول تيرير' },
  { en: 'American Staffordshire Terrier', ar: 'أمريكَن ستافوردشير تيرير' }, { en: 'Australian Cattle Dog', ar: 'أستراليَن كاتل دوق' },
  { en: 'Australian Shepherd', ar: 'أستراليَن شيبرد' }, { en: 'Basenji', ar: 'باسينجي' }, { en: 'Basset Hound', ar: 'باسيت هاوند' },
  { en: 'Beagle', ar: 'بيغل' }, { en: 'Bearded Collie', ar: 'بيردد كولي' }, { en: 'Bernese Mountain Dog', ar: 'بيرنيز ماونتن دوق' },
  { en: 'Bichon Frisé', ar: 'بيشون فريزيه' }, { en: 'Border Collie', ar: 'بوردير كولي' }, { en: 'Border Terrier', ar: 'بوردير تيرير' },
  { en: 'Boston Terrier', ar: 'بوسطن تيرير' }, { en: 'Boxer', ar: 'بوكسر' }, { en: 'Brittany', ar: 'بريتاني' },
  { en: 'Brussels Griffon', ar: 'بروكسل جريفون' }, { en: 'Bulldog', ar: 'بولدوغ' }, { en: 'Bullmastiff', ar: 'بولماستيف' },
  { en: 'Bull Terrier', ar: 'بول تيرير' }, { en: 'Cairn Terrier', ar: 'كيرن تيرير' }, { en: 'Canaan Dog', ar: 'كنعان دوق' },
  { en: 'Cavalier King Charles Spaniel', ar: 'كافالير كينغ تشارلز سبانيَل' }, { en: 'Chesapeake Bay Retriever', ar: 'تشيسابيك باي ريتريفر' },
  { en: 'Chihuahua', ar: 'تشيهواهوا' }, { en: 'Chinese Crested', ar: 'تشاينيز كريستد' }, { en: 'Chow Chow', ar: 'تشاو تشاو' },
  { en: 'Cocker Spaniel', ar: 'كوكر سبانيَل' }, { en: 'Collie', ar: 'كولي' }, { en: 'Coton de Tulear', ar: 'كوتون دي توليار' },
  { en: 'Dachshund', ar: 'داكسهند' }, { en: 'Dalmatian', ar: 'دالميشن' }, { en: 'Doberman Pinscher', ar: 'دوبرمان بنشر' },
  { en: 'English Setter', ar: 'إنجلش ساتر' }, { en: 'English Springer Spaniel', ar: 'إنجلش سبرينغر سبانيَل' },
  { en: 'French Bulldog', ar: 'فرينش بولدوغ' }, { en: 'German Shepherd', ar: 'جيرمن شيبرد' }, { en: 'German Shorthaired Pointer', ar: 'جيرمن شورتيرد بوينتر' },
  { en: 'Giant Schnauzer', ar: 'جاينت شناوزر' }, { en: 'Golden Retriever', ar: 'غولدن ريتريفر' }, { en: 'Great Dane', ar: 'غريت دين' },
  { en: 'Greyhound', ar: 'غريهاوند' }, { en: 'Griffon', ar: 'جريفون' }, { en: 'Havanese', ar: 'هافانيز' },
  { en: 'Irish Setter', ar: 'آيرش ساتر' }, { en: 'Irish Wolfhound', ar: 'آيرش وولفهاوند' }, { en: 'Italian Greyhound', ar: 'إيتاليَن غريهاوند' },
  { en: 'Jack Russell Terrier', ar: 'جاك راسل تيرير' }, { en: 'Japanese Chin', ar: 'جابانيز تشين' }, { en: 'Keeshond', ar: 'كيستهوند' },
  { en: 'King Charles Spaniel', ar: 'كينغ تشارلز سبانيَل' }, { en: 'Labrador Retriever', ar: 'لابرادور ريتريفر' }, { en: 'Lhasa Apso', ar: 'لاسا أبسو' },
  { en: 'Maltese', ar: 'مالتيز' }, { en: 'Manchester Terrier', ar: 'مانشستر تيرير' }, { en: 'Mastiff', ar: 'ماستيف' },
  { en: 'Miniature Pinscher', ar: 'مينياتشر بنشر' }, { en: 'Miniature Schnauzer', ar: 'مينياتشر شناوزر' }, { en: 'Newfoundland', ar: 'نيوفاوندلاند' },
  { en: 'Norfolk Terrier', ar: 'نورفوك تيرير' }, { en: 'Norwegian Elkhound', ar: 'نورويجيان إلكهاوند' }, { en: 'Norwich Terrier', ar: 'نورويتش تيرير' },
  { en: 'Old English Sheepdog', ar: 'أولد إنجلش شيبدوغ' }, { en: 'Papillon', ar: 'بابيون' }, { en: 'Pekingese', ar: 'بكينيز' },
  { en: 'Pembroke Welsh Corgi', ar: 'بيمبروك ويلش كورغي' }, { en: 'Pharaoh Hound', ar: 'فرعون هاوند' }, { en: 'Pomeranian', ar: 'بوميرانيَن' },
  { en: 'Poodle', ar: 'بودل' }, { en: 'Pug', ar: 'باغ' }, { en: 'Rhodesian Ridgeback', ar: 'روديزيان ريدجباك' },
  { en: 'Rottweiler', ar: 'روتوايلر' }, { en: 'Saint Bernard', ar: 'سينت برنارد' }, { en: 'Saluki', ar: 'سالوكي' },
  { en: 'Samoyed', ar: 'ساموييد' }, { en: 'Schipperke', ar: 'شيبيركي' }, { en: 'Scottish Deerhound', ar: 'سكوتش ديرهاوند' },
  { en: 'Scottish Terrier', ar: 'سكوتش تيرير' }, { en: 'Shar-Pei', ar: 'شار بي' }, { en: 'Shetland Sheepdog', ar: 'شتلاند شيبدوغ' },
  { en: 'Shiba Inu', ar: 'شيبا إينو' }, { en: 'Shih Tzu', ar: 'شيه تزو' }, { en: 'Siberian Husky', ar: 'سيبيريَن هاسكي' },
  { en: 'Silky Terrier', ar: 'سيلكي تيرير' }, { en: 'Skye Terrier', ar: 'سكاي تيرير' }, { en: 'Soft-Coated Wheaten Terrier', ar: 'سوفت كوتيد ويتن تيرير' },
  { en: 'Staffordshire Bull Terrier', ar: 'ستافوردشير بول تيرير' }, { en: 'Sussex Spaniel', ar: 'ساسكس سبانيَل' },
  { en: 'Tibetan Spaniel', ar: 'تيبيتن سبانيَل' }, { en: 'Tibetan Terrier', ar: 'تيبيتن تيرير' }, { en: 'Toy Fox Terrier', ar: 'توي فوكس تيرير' },
  { en: 'Vizsla', ar: 'فيزلا' }, { en: 'Weimaraner', ar: 'فايمارانر' }, { en: 'Welsh Corgi', ar: 'ويلش كورغي' },
  { en: 'Welsh Terrier', ar: 'ويلش تيرير' }, { en: 'West Highland White Terrier', ar: 'ويست هايلاند وايت تيرير' },
  { en: 'Whippet', ar: 'ويبت' }, { en: 'Wirehaired Pointing Griffon', ar: 'وايرهيرد بوينتنغ غريفون' }, { en: 'Yorkshire Terrier', ar: 'يوركشير تيرير' }
];

export const CAT_BREEDS = [
  { en: 'Abyssinian', ar: 'أبيسينيَن' }, { en: 'American Bobtail', ar: 'أمريكَن بوبتيل' }, { en: 'American Curl', ar: 'أمريكَن كورل' },
  { en: 'American Shorthair', ar: 'أمريكَن شورتير' }, { en: 'American Wirehair', ar: 'أمريكَن وايرهير' }, { en: 'Balinese', ar: 'بالينيز' },
  { en: 'Bengal', ar: 'بنغال' }, { en: 'Birman', ar: 'بيرمان' }, { en: 'Bombay', ar: 'بومباي' }, { en: 'British Shorthair', ar: 'بريتش شورتير' },
  { en: 'Burmese', ar: 'بورميز' }, { en: 'Burmilla', ar: 'بورميلا' }, { en: 'California Spangled', ar: 'كاليفورنيا سبانغلد' },
  { en: 'Chartreux', ar: 'شارتروه' }, { en: 'Cornish Rex', ar: 'كورنيش ريكس' }, { en: 'Devon Rex', ar: 'ديفون ريكس' },
  { en: 'Egyptian Mau', ar: 'إيجيبشَن ماو' }, { en: 'European Shorthair', ar: 'يوروبيَن شورتير' }, { en: 'Exotic Shorthair', ar: 'إكزوتيك شورتير' },
  { en: 'Havana Brown', ar: 'هافانا براون' }, { en: 'Himalayan', ar: 'هيمالايَن' }, { en: 'Japanese Bobtail', ar: 'جابانيز بوبتيل' },
  { en: 'Javanese', ar: 'جافانيز' }, { en: 'Korat', ar: 'كورات' }, { en: 'LaPerm', ar: 'لا بيرم' }, { en: 'Maine Coon', ar: 'مين كون' },
  { en: 'Manx', ar: 'مانكس' }, { en: 'Munchkin', ar: 'مونتشكن' }, { en: 'Nebelung', ar: 'نيبلونغ' },
  { en: 'Norwegian Forest Cat', ar: 'نورويجيان فورست كات' }, { en: 'Ocicat', ar: 'أوسيكات' }, { en: 'Oriental Shorthair', ar: 'أورينتَل شورتير' },
  { en: 'Persian', ar: 'بيرشَن' }, { en: 'Ragamuffin', ar: 'راغامافن' }, { en: 'Ragdoll', ar: 'راغدول' }, { en: 'Russian Blue', ar: 'راشَن بلو' },
  { en: 'Savannah', ar: 'سافانا' }, { en: 'Scottish Fold', ar: 'سكوتش فولد' }, { en: 'Selkirk Rex', ar: 'سيلكيرك ريكس' }, { en: 'Shirazi', ar: 'شيرازي' },
  { en: 'Siamese', ar: 'سياميز' }, { en: 'Siberian', ar: 'سيبيريَن' }, { en: 'Singapura', ar: 'سينغابورا' }, { en: 'Snowshoe', ar: 'سنوشو' },
  { en: 'Sokoke', ar: 'سوكوكي' }, { en: 'Somali', ar: 'سومالي' }, { en: 'Sphynx', ar: 'سفينكس' }, { en: 'Thai', ar: 'تاي' },
  { en: 'Tonkinese', ar: 'تونكينيز' }, { en: 'Toyger', ar: 'تويغر' }, { en: 'Turkish Angora', ar: 'توركش أنغورا' },
  { en: 'Turkish Van', ar: 'توركش فان' }
];

export const BIRD_BREEDS = [
  { en: 'African Grey Parrot', ar: 'أفريكن غراي باروت' }, { en: 'Amazon Parrot', ar: 'أمازون باروت' },
  { en: 'Budgerigar (Budgie)', ar: 'باجيريغار (باجي)' }, { en: 'Caique', ar: 'كايك' }, { en: 'Canary', ar: 'كاناري' },
  { en: 'Chattering Lori', ar: 'شاتيرينغ لوري' }, { en: 'Cockatiel', ar: 'كوكاتيل' }, { en: 'Cockatoo', ar: 'كوكاتو' },
  { en: 'Conure', ar: 'كونيور' }, { en: 'Dove / Pigeon', ar: 'دوف / بيجن' }, { en: 'Gouldian Finch', ar: 'غولديَن فينش' },
  { en: 'Lovebird', ar: 'لافبيرد' }, { en: 'Macaw', ar: 'ماكاو' }, { en: 'Mitchell\'s Lori', ar: 'ميتشل لوري' },
  { en: 'Quaker Parrot', ar: 'كويكر باروت' }, { en: 'Rainbow Lori', ar: 'رينبو لوري' }, { en: 'Senegal Parrot', ar: 'سينيغال باروت' },
  { en: 'Zebra Finch', ar: 'زيبرا فينش' }
];

export const PERSONALITIES = [
  'Playful', 'Calm', 'Energetic', 'Friendly', 'Quiet', 'Social', 'Brave', 'Smart', 'Loyal', 'Sweet', 'Independent', 'Lazy'
];

export const MOCK_OWNERS: Owner[] = [
  { id: 'owner1', name: 'Ahmed Fawzy', city: 'Cairo', area: 'New Cairo', avatar: 'https://i.pravatar.cc/150?u=ahmed', blockedUserIds: [] },
  { id: 'owner2', name: 'Sara Ali', city: 'Cairo', area: 'Maadi', avatar: 'https://i.pravatar.cc/150?u=sara', blockedUserIds: [] },
  { id: 'owner3', name: 'Mazen Korayem', city: 'Giza', area: 'Sheikh Zayed', avatar: 'https://i.pravatar.cc/150?u=mazen', blockedUserIds: [] },
  { id: 'owner4', name: 'Mona Hassan', city: 'Alexandria', area: 'Smouha', avatar: 'https://i.pravatar.cc/150?u=mona', blockedUserIds: [] },
  { id: 'owner5', name: 'Khaled Omar', city: 'Cairo', area: 'Zamalek', avatar: 'https://i.pravatar.cc/150?u=khaled', blockedUserIds: [] },
  { id: 'owner6', name: 'Layla Said', city: 'Giza', area: 'Dokki', avatar: 'https://i.pravatar.cc/150?u=layla', blockedUserIds: [] },
  { id: 'owner7', name: 'Omar Ibrahim', city: 'Port Said', area: 'Al Arab', avatar: 'https://i.pravatar.cc/150?u=omar', blockedUserIds: [] },
  { id: 'owner8', name: 'Nour Yehia', city: 'Cairo', area: 'Nasr City', avatar: 'https://i.pravatar.cc/150?u=nour', blockedUserIds: [] },
  { id: 'owner9', name: 'Yassin Gad', city: 'Alexandria', area: 'Stanley', avatar: 'https://i.pravatar.cc/150?u=yassin', blockedUserIds: [] },
  { id: 'owner10', name: 'Hoda Mansour', city: 'Giza', area: 'Mohandessin', avatar: 'https://i.pravatar.cc/150?u=hoda', blockedUserIds: [] }
];

export const INITIAL_PETS: Pet[] = [
  { 
    id: 'p1', name: 'Max', age: 2, breed: 'Golden Retriever', location: 'New Cairo, Cairo', description: "Friendly and playful.", gender: 'Male', type: 'Dog', isVaccinated: true, personality: ['Playful', 'Friendly'], 
    images: ['https://images.unsplash.com/photo-1552053831-71594a27632d?w=800'], ownerId: 'owner1', status: 'approved'
  },
  { 
    id: 'p2', name: 'Luna', age: 1, breed: 'Persian', location: 'Maadi, Cairo', description: "Sweet indoor cat.", gender: 'Female', type: 'Cat', isVaccinated: true, personality: ['Calm', 'Sweet'], 
    images: ['https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800'], ownerId: 'owner2', status: 'approved'
  },
  { 
    id: 'p3', name: 'Bella', age: 3, breed: 'Husky', location: 'Sheikh Zayed, Giza', description: "Energetic and vocal.", gender: 'Female', type: 'Dog', isVaccinated: true, personality: ['Energetic', 'Brave'], 
    images: ['https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=800'], ownerId: 'owner3', status: 'approved'
  },
  { 
    id: 'p4', name: 'Charlie', age: 4, breed: 'Labrador', location: 'Smouha, Alexandria', description: "Great with kids and very loyal.", gender: 'Male', type: 'Dog', isVaccinated: true, personality: ['Loyal', 'Sweet'], 
    images: ['https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800'], ownerId: 'owner4', status: 'approved'
  },
  { 
    id: 'p5', name: 'Milo', age: 2, breed: 'Maine Coon', location: 'Zamalek, Cairo', description: "A gentle giant who loves attention.", gender: 'Male', type: 'Cat', isVaccinated: true, personality: ['Friendly', 'Social'], 
    images: ['https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=800'], ownerId: 'owner5', status: 'approved'
  },
  { 
    id: 'p6', name: 'Lucy', age: 1, breed: 'Cockatiel', location: 'Dokki, Giza', description: "Very talkative and loves to whistle.", gender: 'Female', type: 'Bird', isVaccinated: false, personality: ['Social', 'Playful'], 
    images: ['https://images.unsplash.com/photo-1552728089-57bdde30fc3e?w=800'], ownerId: 'owner6', status: 'approved'
  },
  { 
    id: 'p7', name: 'Rocky', age: 5, breed: 'German Shepherd', location: 'Al Arab, Port Said', description: "Strong and protective companion.", gender: 'Male', type: 'Dog', isVaccinated: true, personality: ['Brave', 'Smart'], 
    images: ['https://images.unsplash.com/photo-1589944172325-17196020141a?w=800'], ownerId: 'owner7', status: 'approved'
  },
  { 
    id: 'p8', name: 'Daisy', age: 2, breed: 'Beagle', location: 'Nasr City, Cairo', description: "Loves sniffing everything and long walks.", gender: 'Female', type: 'Dog', isVaccinated: true, personality: ['Playful', 'Friendly'], 
    images: ['https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=800'], ownerId: 'owner8', status: 'approved'
  },
  { 
    id: 'p9', name: 'Leo', age: 3, breed: 'British Shorthair', location: 'Stanley, Alexandria', description: "Independent but loves a good head scratch.", gender: 'Male', type: 'Cat', isVaccinated: true, personality: ['Independent', 'Quiet'], 
    images: ['https://images.unsplash.com/photo-1513245543132-31f507417b26?w=800'], ownerId: 'owner9', status: 'approved'
  },
  { 
    id: 'p10', name: 'Oliver', age: 1, breed: 'Poodle', location: 'Mohandessin, Giza', description: "Highly intelligent and very active.", gender: 'Male', type: 'Dog', isVaccinated: true, personality: ['Smart', 'Energetic'], 
    images: ['https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=800'], ownerId: 'owner10', status: 'approved'
  },
  { 
    id: 'p11', name: 'Chloe', age: 2, breed: 'Siamese', location: 'Zamalek, Cairo', description: "Very vocal and attached to humans.", gender: 'Female', type: 'Cat', isVaccinated: true, personality: ['Social', 'Sweet'], 
    images: ['https://images.unsplash.com/photo-1513360371669-4adaaee41d11?w=800'], ownerId: 'owner5', status: 'approved'
  },
  { 
    id: 'p12', name: 'Buster', age: 4, breed: 'Bulldog', location: 'Maadi, Cairo', description: "Lazy boy who loves his couch.", gender: 'Male', type: 'Dog', isVaccinated: true, personality: ['Lazy', 'Calm'], 
    images: ['https://images.unsplash.com/photo-1517849845537-4d257902454a?w=800'], ownerId: 'owner2', status: 'approved'
  },
  { 
    id: 'p13', name: 'Nala', age: 2, breed: 'Bengal', location: 'New Cairo, Cairo', description: "Beautiful coat and very active.", gender: 'Female', type: 'Cat', isVaccinated: true, personality: ['Energetic', 'Brave'], 
    images: ['https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800'], ownerId: 'owner1', status: 'approved'
  },
  { 
    id: 'p14', name: 'Coco', age: 1, breed: 'Budgie', location: 'Smouha, Alexandria', description: "Colorful and cheerful bird.", gender: 'Female', type: 'Bird', isVaccinated: false, personality: ['Sweet', 'Friendly'], 
    images: ['https://images.unsplash.com/photo-1522858547137-f1dcec554f55?w=800'], ownerId: 'owner4', status: 'approved'
  },
  { 
    id: 'p15', name: 'Zeus', age: 3, breed: 'Rottweiler', location: 'Sheikh Zayed, Giza', description: "Protective but gentle with family.", gender: 'Male', type: 'Dog', isVaccinated: true, personality: ['Loyal', 'Brave'], 
    images: ['https://images.unsplash.com/photo-1567171466295-4afa5814522d?w=800'], ownerId: 'owner3', status: 'approved'
  },
  { 
    id: 'p16', name: 'Ruby', age: 2, breed: 'African Grey', location: 'Stanley, Alexandria', description: "Can mimic almost any sound.", gender: 'Female', type: 'Bird', isVaccinated: false, personality: ['Smart', 'Social'], 
    images: ['https://images.unsplash.com/photo-1552728089-57bdde30fc3e?w=800'], ownerId: 'owner9', status: 'approved'
  },
  { 
    id: 'p17', name: 'Toby', age: 1, breed: 'Chihuahua', location: 'Mohandessin, Giza', description: "Small size, huge personality.", gender: 'Male', type: 'Dog', isVaccinated: true, personality: ['Brave', 'Energetic'], 
    images: ['https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=800'], ownerId: 'owner10', status: 'approved'
  },
  { 
    id: 'p18', name: 'Sophie', age: 3, breed: 'Ragdoll', location: 'Dokki, Giza', description: "Goes limp like a ragdoll when held.", gender: 'Female', type: 'Cat', isVaccinated: true, personality: ['Calm', 'Sweet'], 
    images: ['https://images.unsplash.com/photo-1533743983669-94fa5c4338ec?w=800'], ownerId: 'owner6', status: 'approved'
  },
  { 
    id: 'p19', name: 'Duke', age: 4, breed: 'Great Dane', location: 'Nasr City, Cairo', description: "The biggest heart in the biggest dog.", gender: 'Male', type: 'Dog', isVaccinated: true, personality: ['Sweet', 'Calm'], 
    images: ['https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=800'], ownerId: 'owner8', status: 'approved'
  },
  { 
    id: 'p20', name: 'Lilly', age: 1, breed: 'Sphynx', location: 'Al Manakh, Port Said', description: "Unique hairless beauty.", gender: 'Female', type: 'Cat', isVaccinated: true, personality: ['Social', 'Independent'], 
    images: ['https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?w=800'], ownerId: 'owner7', status: 'approved'
  }
];

export const formatLocation = (area: string, city: string, lang: string = 'en') => {
  if (!area && !city) return '';
  
  // If city is passed as full "Area, City" combined string
  if (area && area.includes(',') && !city) {
    const parts = area.split(',').map(s => s.trim());
    area = parts[0] || '';
    city = parts[1] || '';
  }

  const cityData = CITIES_DATA.find(c => c.en.toLowerCase() === (city || '').toLowerCase() || c.ar === city);
  const areaData = cityData?.areas.find(a => a.en.toLowerCase() === (area || '').toLowerCase() || a.ar === area);
  
  if (lang === 'ar') {
    const cityAr = cityData?.ar || city;
    const areaAr = areaData?.ar || area;
    if (!area) return cityAr;
    if (!city) return areaAr;
    return `${areaAr}, ${cityAr}`;
  }
  
  if (!area) return city;
  if (!city) return area;
  return `${area}, ${city}`;
};

export const translateBreed = (breed: string, lang: string = 'en') => {
  if (!breed) return '';
  if (lang !== 'ar') return breed;
  const allBreeds = [...DOG_BREEDS, ...CAT_BREEDS, ...BIRD_BREEDS];
  const found = allBreeds.find(b => b.en.toLowerCase() === breed.toLowerCase() || b.ar === breed);
  return found?.ar || breed;
};
