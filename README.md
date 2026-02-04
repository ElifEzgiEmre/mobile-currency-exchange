## Mobil Döviz Değişim Sistemi – Ağ Odaklı Proje

Bu proje, “Mobil Sistemlerde Ağ Sorunları” dersi kapsamında tasarlanan **Mobil Döviz Değişim Sistemi** uygulamasının örnek bir implementasyonudur. Proje; basit bir **Node.js/Express backend**, örnek bir **SQL veritabanı şeması** ve CDN üzerinden çalışan hafif bir **React tabanlı frontend** içerir.

### Klasör Yapısı

- `backend/` – Node.js + Express web servisi  
- `database/` – SQL şema dosyası  
- `frontend/` – Basit React arayüzü (CDN ile)  

### Çalıştırma (Backend)

1. `cd backend`
2. `npm install`
3. `.env` dosyasını `.env.example` temel alınarak oluşturun (gerekirse).
4. `npm start`

Sunucu varsayılan olarak `http://localhost:4000` adresinde çalışır.

### Çalıştırma (Frontend)

- `frontend/index.html` dosyasını bir canlı sunucu ile (ör. VS Code Live Server, `python -m http.server` vb.) açın  
  veya dosyayı doğrudan tarayıcıda açıp CORS ayarlarını ihtiyaç halinde backend tarafında güncelleyin.

### Notlar

- Bu proje, ders dokümantasyonundaki gereksinimlere uygun olarak **kullanıcı**, **döviz kuru**, **alım/satım işlemleri** ve **işlem geçmişi** akışlarını örneklemektedir.
- Veritabanı bağlantısı yerine backend tarafında **in-memory (bellek içi) veri tutma** kullanılmıştır; `database/schema.sql` bu yapının gerçek bir SQL veritabanına nasıl taşınacağını gösterir.



