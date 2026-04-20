# Epic 1 PRD — Makro Strateji Dashboard

## Amaç
Epic 1, bir hisse/portföy ekranı değil; ABD ve Türkiye makroekonomi verilerini bir araya getirip yatırım ortamını yorumlayan bir strateji merkezidir.

## Kapsam
- ABD makro verileri: 10Y/2Y getiriler, VIX, Fed balance sheet, faiz beklentileri, likidite göstergeleri, piyasa risk iştahı.
- Türkiye makro verileri: 5Y CDS, TCMB rezervleri, politika faizi bağlamı, enflasyon/kur/reel faiz görünümü.
- Veri kartlarının her biri için iki açıklama zorunludur:
  - Nedir?
  - Nasıl yorumlanır?
- Tüm içerik ve UI anlamlı şekilde Türkçedir.
- Tüm makro verileri sentezleyen genel bir AI özeti bulunur: Yatırım yapılabilir ortam mı?
- ABD için ayrıca Fear & Greed Index ve investors.com kaynaklı CAN SLIM % exposure metriği gösterilir.

## Kullanıcıya görünen deneyim
- Ana ekran makro strateji odaklı olmalıdır.
- Hisse senetleri, portföy pozisyonları ve benzeri yüzeyler Epic 1 içinde yer almaz.
- Her bölge veya tema için açıklayıcı kartlar ve trend görünümleri gösterilir.
- Veri kaynağı ve son güncellenme zamanı her kartta görünür.
- Loading, error ve empty state’ler her ana modül için bulunur.

## Gerekli veri açıklamaları
Her veri noktasında şu alanlar görünür ya da erişilebilir olmalıdır:
- Değer
- Birim
- Kısa tanım
- Nasıl yorumlanır açıklaması
- Kaynak adı
- Son güncelleme zamanı

## Gerekli kaynaklar
Açıkça belirtilmesi gereken örnek kaynaklar:
- FRED
- FMP
- Federal Reserve
- U.S. Treasury
- TCMB
- Turkish Statistical Institute / uygun resmi kaynaklar
- investors.com
- Fear & Greed Index sağlayıcısı

## AI özeti
Dashboard’da üst seviye bir özet kartı bulunur. Bu kart:
- bütün makro sinyalleri tek paragraf halinde sentezler,
- ortamın risk iştahı / baskı / nötr / destekleyici durumunu yorumlar,
- yatırım yapılabilirlik hakkında kesin hüküm vermeden bağlamsal değerlendirme sunar,
- Türkçe üretilir.

## Teknik gereksinimler
- Veri modelleri açık tipli ve genişletilebilir olmalıdır.
- Her veri kaydında source metadata zorunludur.
- Türkçe UI metinleri için localization katmanı gerekir.
- AI özet üretimi için ayrı bir servis/katman tasarlanmalıdır.
- ABD ve TR için veri kümeleri ayrıştırılmalıdır.
- MacroIndicator, MacroRegionSnapshot, YieldCurveSnapshot, MacroSignalCard, MacroTheme ve MacroEvent benzeri domain objeleri desteklenmelidir.
- Tüm kartlar mock-first veri ile çalışmalıdır.

## Başarı ölçütleri
- Ekran makro strateji merkezi gibi görünür.
- Veri kartları açıklamalı ve kaynaklıdır.
- Türkçe UI tutarlıdır.
- AI özeti makro sinyalleri bir araya getirir.
- Fear & Greed ve CAN SLIM exposure metrikleri ABD görünümünde yer alır.
- Hisse/pozisyon içeriği Epic 2’ye bırakılmıştır.
