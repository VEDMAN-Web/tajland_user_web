"use client";

import { Fragment, createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

export type DashboardLanguage = "EN" | "PL" | "TH";

const translations: Record<string, Record<Exclude<DashboardLanguage, "EN">, string>> = {
  Home: { PL: "Strona główna", TH: "หน้าหลัก" },
  "Explore Map": { PL: "Eksploruj mapę", TH: "สำรวจแผนที่" },
  "My Land": { PL: "Moja ziemia", TH: "ที่ดินของฉัน" },
  English: { PL: "Angielski", TH: "อังกฤษ" },
  Polish: { PL: "Polski", TH: "โปแลนด์" },
  Thai: { PL: "Tajski", TH: "ไทย" },
  Profile: { PL: "Profil", TH: "โปรไฟล์" },
  "Change Password": { PL: "Zmień hasło", TH: "เปลี่ยนรหัสผ่าน" },
  "My Purchases": { PL: "Moje zakupy", TH: "การซื้อของฉัน" },
  "My Certificates": { PL: "Moje certyfikaty", TH: "ใบรับรองของฉัน" },
  Settings: { PL: "Ustawienia", TH: "การตั้งค่า" },
  "Help & Support": { PL: "Pomoc i wsparcie", TH: "ช่วยเหลือและสนับสนุน" },
  "Term & Condition": { PL: "Warunki", TH: "ข้อกำหนดและเงื่อนไข" },
  "Terms and Conditions": { PL: "Warunki", TH: "ข้อกำหนดและเงื่อนไข" },
  "Privacy Policy": { PL: "Polityka prywatności", TH: "นโยบายความเป็นส่วนตัว" },
  "Account Menu": { PL: "Menu konta", TH: "เมนูบัญชี" },
  Logout: { PL: "Wyloguj", TH: "ออกจากระบบ" },
  Cart: { PL: "Koszyk", TH: "รถเข็น" },
  "My Profile": { PL: "Mój profil", TH: "โปรไฟล์ของฉัน" },
  "All Purchases": { PL: "Wszystkie zakupy", TH: "การซื้อทั้งหมด" },
  "All Certificates": { PL: "Wszystkie certyfikaty", TH: "ใบรับรองทั้งหมด" },
  Filter: { PL: "Filtruj", TH: "กรอง" },
  Sort: { PL: "Sortuj", TH: "เรียงลำดับ" },
  Apply: { PL: "Zastosuj", TH: "ใช้" },
  Reset: { PL: "Resetuj", TH: "รีเซ็ต" },
  "Clear All": { PL: "Wyczyść wszystko", TH: "ล้างทั้งหมด" },
  Search: { PL: "Szukaj", TH: "ค้นหา" },
  "View Details": { PL: "Zobacz szczegóły", TH: "ดูรายละเอียด" },
  "View Map": { PL: "Zobacz mapę", TH: "ดูแผนที่" },
  "View Certificate": { PL: "Zobacz certyfikat", TH: "ดูใบรับรอง" },
  Download: { PL: "Pobierz", TH: "ดาวน์โหลด" },
  Share: { PL: "Udostępnij", TH: "แชร์" },
  Close: { PL: "Zamknij", TH: "ปิด" },
  Cancel: { PL: "Anuluj", TH: "ยกเลิก" },
  Save: { PL: "Zapisz", TH: "บันทึก" },
  Edit: { PL: "Edytuj", TH: "แก้ไข" },
  "Back to Dashboard": { PL: "Powrót do panelu", TH: "กลับไปที่แดชบอร์ด" },
  "Back to Cart": { PL: "Powrót do koszyka", TH: "กลับไปที่รถเข็น" },
  "Back to My Certificates": { PL: "Powrót do certyfikatów", TH: "กลับไปที่ใบรับรอง" },
  "Total Owned": { PL: "Łącznie posiadane", TH: "ที่ดินทั้งหมด" },
  "Total Spent": { PL: "Łącznie wydano", TH: "ยอดใช้จ่ายทั้งหมด" },
  Regions: { PL: "Regiony", TH: "ภูมิภาค" },
  "Order Summary": { PL: "Podsumowanie zamówienia", TH: "สรุปคำสั่งซื้อ" },
  "Payment Information": { PL: "Informacje o płatności", TH: "ข้อมูลการชำระเงิน" },
  Completed: { PL: "Zakończone", TH: "เสร็จสิ้น" },
  Pending: { PL: "Oczekujące", TH: "รอดำเนินการ" },
  Available: { PL: "Dostępne", TH: "พร้อมใช้งาน" },
  "No purchases match the selected filters.": {
    PL: "Żadne zakupy nie pasują do wybranych filtrów.",
    TH: "ไม่มีการซื้อที่ตรงกับตัวกรองที่เลือก",
  },
  "No certificates match the selected filters.": {
    PL: "Żadne certyfikaty nie pasują do wybranych filtrów.",
    TH: "ไม่มีใบรับรองที่ตรงกับตัวกรองที่เลือก",
  },
  "Your collection of places across Thailand., all in one place.": {
    PL: "Twoja kolekcja miejsc w Tajlandii w jednym miejscu.",
    TH: "คอลเลกชันสถานที่ของคุณทั่วประเทศไทยในที่เดียว",
  },
  "Explore Thailand": { PL: "Odkrywaj Tajlandię", TH: "สำรวจประเทศไทย" },
  "Give a Little Piece of Thailand": {
    PL: "Podaruj kawałek Tajlandii",
    TH: "มอบชิ้นส่วนเล็กๆ ของประเทศไทย",
  },
  "Gift a plot": { PL: "Podaruj działkę", TH: "มอบแปลงที่ดิน" },
  "Information We Collect": {
    PL: "Informacje, które zbieramy",
    TH: "ข้อมูลที่เราเก็บรวบรวม",
  },
  "How We Use Your Information": {
    PL: "Jak wykorzystujemy Twoje informacje",
    TH: "เราใช้ข้อมูลของคุณอย่างไร",
  },
  "Table of Contents": { PL: "Spis treści", TH: "สารบัญ" },
  Language: { PL: "Język", TH: "ภาษา" },
  "Open dashboard menu": { PL: "Otwórz menu panelu", TH: "เปิดเมนูแดชบอร์ด" },
  "Loading dashboard...": { PL: "Ładowanie panelu...", TH: "กำลังโหลดแดชบอร์ด..." },
  "Loading map...": { PL: "Ładowanie mapy...", TH: "กำลังโหลดแผนที่..." },
  "Loading profile...": { PL: "Ładowanie profilu...", TH: "กำลังโหลดโปรไฟlu..." },
  "Loading support...": { PL: "Ładowanie pomocy...", TH: "กำลังโหลดการช่วยเหลือ..." },
  "Loading settings...": { PL: "Ładowanie ustawień...", TH: "กำลังโหลดการตั้งค่า..." },
  "Loading order...": { PL: "Ładowanie zamówienia...", TH: "กำลังโหลดคำสั่งซื้อ..." },
  "Your Tajlandia Home": { PL: "Twój dom Tajlandia", TH: "บ้าน Tajlandia ของคุณ" },
  "Welcome back,": { PL: "Witaj ponownie,", TH: "ยินดีต้อนรับกลับมา," },
  "Here’s everything you own in Thailand.": { PL: "Oto wszystko, co posiadasz w Tajlandii.", TH: "นี่คือทุกสิ่งที่คุณเป็นเจ้าของในประเทศไทย" },
  "Explore Thailand →": { PL: "Odkrywaj Tajlandię →", TH: "สำรวจประเทศไทย →" },
  "Ownership Overview": { PL: "Przegląd własności", TH: "ภาพรวมความเป็นเจ้าของ" },
  "Your Collection": { PL: "Twoja kolekcja", TH: "คอลเลกชันของคุณ" },
  "All holdings verified across Thailand": { PL: "Wszystkie aktywa zweryfikowane w Tajlandii", TH: "ตรวจสอบทรัพย์สินทั้งหมดทั่วประเทศไทยแล้ว" },
  "Total Land (Sq Rai)": { PL: "Łączna ziemia (rai kw.)", TH: "ที่ดินทั้งหมด (ไร่ ตร.)" },
  "Plots Claimed": { PL: "Zajęte działki", TH: "แปลงที่อ้างสิทธิ์" },
  "Your Land Archive": { PL: "Archiwum twojej ziemi", TH: "คลังที่ดินของคุณ" },
  "Share a place worth remembering. Gift a Tajlandia plot to someone special and let them build their own collection.": { PL: "Podaruj miejsce warte zapamiętania. Podaruj działkę Tajlandia bliskiej osobie i pozwól jej zbudować własną kolekcję.", TH: "แบ่งปันสถานที่ที่ควรค่าแก่การจดจำ มอบแปลง Tajlandia ให้คนพิเศษและให้พวกเขาสร้างคอลเลกชันของตนเอง" },
  "Instant Digital Certificate": { PL: "Natychmiastowy certyfikat cyfrowy", TH: "ใบรับรองดิจิทัลทันที" },
  "Official Cadastre Deed": { PL: "Oficjalny akt katastralny", TH: "โฉนดที่ดินอย่างเป็นทางการ" },
  "Discover Plots →": { PL: "Odkryj działki →", TH: "ค้นหาแปลงที่ดิน →" },
  "Island life, reimagined.": { PL: "Życie na wyspie na nowo.", TH: "ชีวิตบนเกาะในมุมมองใหม่" },
  "Where limestone meets the sea.": { PL: "Gdzie wapienne skały spotykają morze.", TH: "ที่ซึ่งภูเขาหินปูนพบกับทะเล" },
  "Mountains, culture and quiet.": { PL: "Góry, kultura i spokój.", TH: "ภูเขา วัฒนธรรม และความสงบ" },
  "Energy, culture and endless discovery.": { PL: "Energia, kultura i niekończące się odkrycia.", TH: "พลัง วัฒนธรรม และการค้นพบไม่รู้จบ" },
  "Coastal escapes, just beyond the city.": { PL: "Nadmorski odpoczynek tuż za miastem.", TH: "ชายฝั่งแสนสงบที่อยู่ไม่ไกลจากเมือง" },
  "Island serenity, beautifully preserved.": { PL: "Pięknie zachowany spokój wyspy.", TH: "ความสงบของเกาะที่ได้รับการดูแลอย่างงดงาม" },
  "Account Security": { PL: "Bezpieczeństwo konta", TH: "ความปลอดภัยของบัญชี" },
  "Authentication & Safeguards": { PL: "Uwierzytelnianie i zabezpieczenia", TH: "การยืนยันตัวตนและการป้องกัน" },
  "Interface & Chatbot Language": { PL: "Język interfejsu i chatbota", TH: "ภาษาของอินเทอร์เฟซและแชตบอต" },
  "Language applies to land title dossiers, notifications, and cadastral maps.": { PL: "Język dotyczy dokumentacji własności, powiadomień i map katastralnych.", TH: "ภาษานี้ใช้กับเอกสารสิทธิ์ที่ดิน การแจ้งเตือน และแผนที่ที่ดิน" },
  "Email notifications": { PL: "Powiadomienia e-mail", TH: "การแจ้งเตือนทางอีเมล" },
  "You'll receive important account and purchase updates by email.": { PL: "Otrzymasz ważne aktualizacje konta i zakupów e-mailem.", TH: "คุณจะได้รับการอัปเดตบัญชีและการซื้อที่สำคัญทางอีเมล" },
  "Settings saved.": { PL: "Ustawienia zapisane.", TH: "บันทึกการตั้งค่าแล้ว" },
  "Manage your personal information and account.": { PL: "Zarządzaj danymi osobowymi i kontem.", TH: "จัดการข้อมูลส่วนตัวและบัญชีของคุณ" },
  "Personal Information": { PL: "Dane osobowe", TH: "ข้อมูลส่วนบุคคล" },
  "Official account information registered on file": { PL: "Oficjalne informacje zapisane na koncie", TH: "ข้อมูลบัญชีอย่างเป็นทางการที่ลงทะเบียนไว้" },
  "First name": { PL: "Imię", TH: "ชื่อ" },
  "Last name": { PL: "Nazwisko", TH: "นามสกุล" },
  "Mobile Number": { PL: "Numer telefonu", TH: "หมายเลขโทรศัพท์มือถือ" },
  "Not provided": { PL: "Nie podano", TH: "ไม่ได้ระบุ" },
  "Edit Profile →": { PL: "Edytuj profil →", TH: "แก้ไขโปรไฟล์ →" },
  "Update your personal information and account.": { PL: "Zaktualizuj dane osobowe i konto.", TH: "อัปเดตข้อมูลส่วนตัวและบัญชีของคุณ" },
  "Update your password to keep your account secure.": { PL: "Zaktualizuj hasło, aby chronić konto.", TH: "อัปเดตรหัสผ่านเพื่อรักษาความปลอดภัยของบัญชี" },
  "Current Password": { PL: "Obecne hasło", TH: "รหัสผ่านปัจจุบัน" },
  "New Password": { PL: "Nowe hasło", TH: "รหัสผ่านใหม่" },
  "Confirm Password": { PL: "Potwierdź hasło", TH: "ยืนยันรหัสผ่าน" },
  Strong: { PL: "Silne", TH: "แข็งแรง" },
  Average: { PL: "Średnie", TH: "ปานกลาง" },
  Weak: { PL: "Słabe", TH: "อ่อนแอ" },
  Show: { PL: "Pokaż", TH: "แสดง" },
  Hide: { PL: "Ukryj", TH: "ซ่อน" },
  "Passwords do not match": { PL: "Hasła nie są zgodne", TH: "รหัสผ่านไม่ตรงกัน" },
  "Confirm password is required": { PL: "Potwierdzenie hasła jest wymagane", TH: "ต้องยืนยันรหัสผ่าน" },
  "Something went wrong.": { PL: "Coś poszło nie tak.", TH: "เกิดข้อผิดพลาด" },
  "Try again": { PL: "Spróbuj ponownie", TH: "ลองอีกครั้ง" },
  "Do you provide customized modular kitchens?": { PL: "Czy oferujecie niestandardowe kuchnie modułowe?", TH: "มีครัวโมดูลาร์แบบกำหนดเองหรือไม่" },
  "Yes. Every kitchen is custom-designed to match your space, cooking habits, and style preferences.": { PL: "Tak. Każda kuchnia jest projektowana indywidualnie do przestrzeni, nawyków i stylu.", TH: "ใช่ เราออกแบบครัวแต่ละแบบให้เหมาะกับพื้นที่ นิสัยการทำอาหาร และสไตล์ของคุณ" },
  "How do I choose a place to collect?": { PL: "Jak wybrać miejsce do kolekcji?", TH: "ฉันจะเลือกสถานที่สะสมได้อย่างไร" },
  "When will I receive my certificate?": { PL: "Kiedy otrzymam certyfikat?", TH: "ฉันจะได้รับใบรับรองเมื่อใด" },
  "Can I gift a Tajlandia collection?": { PL: "Czy mogę podarować kolekcję Tajlandia?", TH: "ฉันสามารถมอบคอลเลกชัน Tajlandia เป็นของขวัญได้หรือไม่" },
  "Other": { PL: "Inne", TH: "อื่นๆ" },
  "Send your Queries...": { PL: "Wyślij zapytanie...", TH: "ส่งคำถามของคุณ..." },
  "Please enter at least 20 words.": { PL: "Wpisz co najmniej 20 słów.", TH: "กรุณาป้อนอย่างน้อย 20 คำ" },
  "Message sent successfully.": { PL: "Wiadomość wysłana pomyślnie.", TH: "ส่งข้อความสำเร็จแล้ว" },
  "Send Message →": { PL: "Wyślij wiadomość →", TH: "ส่งข้อความ →" },
  "Still need help?": { PL: "Nadal potrzebujesz pomocy?", TH: "ยังต้องการความช่วยเหลือหรือไม่" },
  "Within 24 hours": { PL: "W ciągu 24 godzin", TH: "ภายใน 24 ชั่วโมง" },
  "Direct mail": { PL: "Bezpośredni e-mail", TH: "อีเมลโดยตรง" },
  "Order #1234": { PL: "Zamówienie nr 1234", TH: "คำสั่งซื้อ #1234" },
  "Track your purchases and view your order details.": { PL: "Śledź zakupy i wyświetl szczegóły zamówienia.", TH: "ติดตามการซื้อและดูรายละเอียดคำสั่งซื้อ" },
  "Order ID": { PL: "ID zamówienia", TH: "รหัสคำสั่งซื้อ" },
  Date: { PL: "Data", TH: "วันที่" },
  "Acquired Deeds": { PL: "Nabyte akty", TH: "โฉนดที่ได้รับ" },
  "Cumulative Surface": { PL: "Łączna powierzchnia", TH: "พื้นที่สะสม" },
  "Seaview Ridge Plot": { PL: "Działka Seaview Ridge", TH: "แปลงซีวิวริดจ์" },
  "Explore on Map ↗": { PL: "Eksploruj na mapie ↗", TH: "สำรวจบนแผนที่ ↗" },
  Plots: { PL: "Działki", TH: "แปลงที่ดิน" },
  "Total Rai": { PL: "Łącznie rai", TH: "ไร่ทั้งหมด" },
  "Icon Zone": { PL: "Strefa Icon", TH: "โซนไอคอน" },
  "Popular Zone": { PL: "Strefa Popular", TH: "โซนยอดนิยม" },
  "Standard Zone": { PL: "Strefa Standard", TH: "โซนมาตandardowa" },
  Subtotal: { PL: "Suma częściowa", TH: "ยอดรวมย่อย" },
  Total: { PL: "Razem", TH: "รวม" },
  Paid: { PL: "Opłacono", TH: "ชำระแล้ว" },
  "Search Maps": { PL: "Szukaj na mapie", TH: "ค้นหาแผนที่" },
  "Clear search": { PL: "Wyczyść wyszukiwanie", TH: "ล้างการค้นหา" },
  "Plot Status": { PL: "Status działki", TH: "สถานะแปลงที่ดิน" },
  Locked: { PL: "Zablokowane", TH: "ล็อกแล้ว" },
  Taken: { PL: "Zajęte", TH: "ถูกจองแล้ว" },
  "Your plots": { PL: "Twoje działki", TH: "แปลงของคุณ" },
  "All plots": { PL: "Wszystkie działki", TH: "แปลงทั้งหมด" },
  "Recently viewed": { PL: "Ostatnio oglądane", TH: "ดูล่าสุด" },
  Name: { PL: "Nazwa", TH: "ชื่อ" },
  "Most locations": { PL: "Najwięcej lokalizacji", TH: "สถานที่มากที่สุด" },
  "No places match your search.": { PL: "Brak miejsc pasujących do wyszukiwania.", TH: "ไม่พบสถานที่ที่ตรงกับการค้นหา" },
  "Show less": { PL: "Pokaż mniej", TH: "แสดงน้อยลง" },
  "More from recent history": { PL: "Więcej z ostatniej historii", TH: "เพิ่มเติมจากประวัติล่าสุด" },
  "Current location": { PL: "Bieżąca lokalizacja", TH: "ตำแหน่งปัจจุบัน" },
  "Zoom in": { PL: "Powiększ", TH: "ซูมเข้า" },
  "Zoom out": { PL: "Pomniejsz", TH: "ซูมออก" },
  "Selected Plots": { PL: "Wybrane działki", TH: "แปลงที่เลือก" },
  "Enter Code": { PL: "Wpisz kod", TH: "ป้อนรหัส" },
  "Certificate PDF": { PL: "PDF certyfikatu", TH: "PDF ใบรับรอง" },
  "Certificate ID": { PL: "ID certyfikatu", TH: "รหัสใบรับรอง" },
  "Registered Owner": { PL: "Zarejestrowany właściciel", TH: "เจ้าของที่ลงทะเบียน" },
  Location: { PL: "Lokalizacja", TH: "ที่ตั้ง" },
  "Total Area": { PL: "Łączna powierzchnia", TH: "พื้นที่ทั้งหมด" },
  "Plots Count": { PL: "Liczba działek", TH: "จำนวนแปลง" },
  "Issuing Authority": { PL: "Organ wydający", TH: "หน่วยงานผู้ออก" },
  "Issue Date": { PL: "Data wydania", TH: "วันที่ออก" },
  "Copy link": { PL: "Kopiuj link", TH: "คัดลอกลิงก์" },
  Copied: { PL: "Skopiowano", TH: "คัดลอกแล้ว" },
  Recommended: { PL: "Polecane", TH: "แนะนำ" },
  "Curated by premier parcel score": { PL: "Wybrane według najlepszego wyniku działki", TH: "คัดสรรตามคะแนนแปลงชั้นนำ" },
  "Curated by newly added": { PL: "Wybrane według najnowszych", TH: "คัดสรรจากรายการใหม่" },
  "Price: Low to High": { PL: "Cena: od najniższej", TH: "ราคา: ต่ำไปสูง" },
  "Price: High to Low": { PL: "Cena: od najwyższej", TH: "ราคา: สูงไปต่ำ" },
  "Land Area: Small to Large": { PL: "Powierzchnia: od małej do dużej", TH: "พื้นที่: เล็กไปใหญ่" },
  "Land Area: Large to Small": { PL: "Powierzchnia: od dużej do małej", TH: "พื้นที่: ใหญ่ไปเล็ก" },
  "Date: Old to New": { PL: "Data: od najstarszej", TH: "วันที่: เก่าไปใหม่" },
  "Date: New to Old": { PL: "Data: od najnowszej", TH: "วันที่: ใหม่ไปเก่า" },
  "Certificate ID (A-Z)": { PL: "ID certyfikatu (A-Z)", TH: "รหัสใบรับรอง (A-Z)" },
  "Certificate ID (Z-A)": { PL: "ID certyfikatu (Z-A)", TH: "รหัสใบรับรอง (Z-A)" },
  "Newest Added": { PL: "Najnowsze dodane", TH: "เพิ่มล่าสุด" },
  Recent: { PL: "Najnowsze", TH: "ล่าสุด" },
  "My Plots": { PL: "Moje działki", TH: "แปลงของฉัน" },
  "Gifted Plots": { PL: "Podarowane działki", TH: "แปลงที่ได้รับเป็นของขวัญ" },
  "All Zones": { PL: "Wszystkie strefy", TH: "ทุกโซน" },
  Icon: { PL: "Icon", TH: "ไอคอน" },
  Popular: { PL: "Popularne", TH: "ยอดนิยม" },
  Standard: { PL: "Standardowe", TH: "มาตรฐาน" },
  "Land Area (Rai)": { PL: "Powierzchnia ziemi (rai)", TH: "พื้นที่ดิน (ไร่)" },
  "Price Range (USD)": { PL: "Zakres cen (USD)", TH: "ช่วงราคา (USD)" },
  "77 plots found": { PL: "Znaleziono 77 działek", TH: "พบ 77 แปลง" },
  "Certificates found": { PL: "Znaleziono certyfikaty", TH: "พบใบรับรอง" },
  "0 certificates found": { PL: "Nie znaleziono certyfikatów", TH: "ไม่พบใบรับรอง" },
  Area: { PL: "Powierzchnia", TH: "พื้นที่" },
  Rate: { PL: "Stawka", TH: "อัตรา" },
  "Amt Paid": { PL: "Zapłacono", TH: "ยอดชำระ" },
  "NEXT STEP:": { PL: "NASTĘPNY KROK:", TH: "ขั้นตอนถัดไป:" },
  "Select parcels from any": { PL: "Wybierz działki z dowolnego", TH: "เลือกแปลงจาก" },
  "All changes verified under 256-bit Cadastral Escrow protocol.": { PL: "Wszystkie zmiany zweryfikowane w protokole Cadastral Escrow 256-bit.", TH: "ตรวจสอบการเปลี่ยนแปลงทั้งหมดภายใต้โปรโตคอล Cadastral Escrow 256 บิตแล้ว" },
  "Save Changes": { PL: "Zapisz zmiany", TH: "บันทึกการเปลี่ยนแปลง" },
  Discard: { PL: "Odrzuć", TH: "ยกเลิก" },
  "Change Photo": { PL: "Zmień zdjęcie", TH: "เปลี่ยนรูปภาพ" },
  "Add Photo": { PL: "Dodaj zdjęcie", TH: "เพิ่มรูปภาพ" },
  "Terms of Service": { PL: "Warunki korzystania", TH: "ข้อกำหนดการใช้บริการ" },
  "Profile updated successfully.": { PL: "Profil zaktualizowany pomyślnie.", TH: "อัปเดตโปรไฟล์สำเร็จแล้ว" },
  "Your profile has been saved successfully.": { PL: "Twój profil został zapisany.", TH: "บันทึกโปรไฟล์ของคุณสำเร็จแล้ว" },
  Okay: { PL: "OK", TH: "ตกลง" },
  "Total:": { PL: "Razem:", TH: "รวม:" },
  "NEXT STEP: Select parcels from any": { PL: "NASTĘPNY KROK: Wybierz działki z dowolnego", TH: "ขั้นตอนถัดไป: เลือกแปลงจาก" },
  "Remove": { PL: "Usuń", TH: "ลบ" },
  "Tajlandia Certificate": { PL: "Certyfikat Tajlandia", TH: "ใบรับรอง Tajlandia" },
  "Share certificate": { PL: "Udostępnij certyfikat", TH: "แชร์ใบรับรอง" },
  "Share order": { PL: "Udostępnij zamówienie", TH: "แชร์คำสั่งซื้อ" },
};

type DashboardLanguageContextValue = {
  language: DashboardLanguage;
  setLanguage: (language: DashboardLanguage) => void;
};

const DashboardLanguageContext = createContext<DashboardLanguageContextValue | null>(
  null,
);

const originalTextByNode = new WeakMap<Text, string>();
const originalAttributeByElement = new WeakMap<HTMLElement, Map<string, string>>();

function translateDashboardText(language: DashboardLanguage) {
  if (typeof document === "undefined") return;
  const reverse = Object.fromEntries(
    Object.entries(translations).flatMap(([source, values]) =>
      Object.entries(values).map(([target, translated]) => [translated, source]),
    ),
  );
  const sourceKeys = Object.keys(translations).sort((a, b) => b.length - a.length);
  const targetKeys = Object.keys(reverse).sort((a, b) => b.length - a.length);
  const translateValue = (value: string) => {
    // Repair legacy DOM text that was corrupted by the previous cumulative translator.
    let next = value.replace(/profilee+/gi, "Profile");
    if (language === "EN") {
      for (const target of targetKeys) next = next.split(target).join(reverse[target]);
      return next;
    }
    for (const source of sourceKeys) {
      const translated = translations[source]?.[language];
      if (!translated) continue;
      next = next.split(source).join(translated);
    }
    return next;
  };
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) nodes.push(node as Text);
  for (const textNode of nodes) {
    if ((textNode.parentElement as HTMLElement | null)?.closest("[data-language-selector]")
      || (textNode.parentElement as HTMLElement | null)?.closest("[data-no-translate]")) continue;
    const value = textNode.nodeValue ?? "";
    const trimmed = value.trim();
    if (!trimmed) continue;
    const originalValue = originalTextByNode.get(textNode) ?? value;
    originalTextByNode.set(textNode, originalValue);
    const translated = translateValue(originalValue);
    if (translated !== value) textNode.nodeValue = translated;
  }

  const translatableAttributes = ["aria-label", "aria-description", "placeholder", "title", "alt"];
  for (const element of Array.from(document.querySelectorAll<HTMLElement>("*"))) {
    if (element.closest("[data-language-selector], [data-no-translate]")) continue;
    const originalAttributes = originalAttributeByElement.get(element) ?? new Map<string, string>();
    originalAttributeByElement.set(element, originalAttributes);
    for (const attribute of translatableAttributes) {
      const value = element.getAttribute(attribute);
      if (!value) continue;
      const originalValue = originalAttributes.get(attribute) ?? value;
      originalAttributes.set(attribute, originalValue);
      const translated = translateValue(originalValue);
      if (translated !== value) element.setAttribute(attribute, translated);
    }
  }
}

export function DashboardLanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<DashboardLanguage>("EN");
  const pathname = usePathname();

  useEffect(() => {
    const stored = window.localStorage.getItem("tajlandia_dashboard_language");
    if (stored === "EN" || stored === "PL" || stored === "TH") setLanguageState(stored);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("tajlandia_dashboard_language", language);
    document.documentElement.lang =
      language === "TH" ? "th" : language === "PL" ? "pl" : "en";
    const frame = window.requestAnimationFrame(() => translateDashboardText(language));
    return () => window.cancelAnimationFrame(frame);
  }, [language, pathname]);

  const value = useMemo(
    () => ({
      language,
      setLanguage: (nextLanguage: DashboardLanguage) => setLanguageState(nextLanguage),
    }),
    [language],
  );

  return (
    <DashboardLanguageContext.Provider value={value}>
      <Fragment key={language}>{children}</Fragment>
    </DashboardLanguageContext.Provider>
  );
}

export function useDashboardLanguage() {
  const context = useContext(DashboardLanguageContext);
  if (!context)
    throw new Error("useDashboardLanguage must be used within DashboardLanguageProvider");
  return context;
}
