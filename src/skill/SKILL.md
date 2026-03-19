---
name: Content Creation Skill System
description: Hệ thống skill tạo nội dung đa kênh — tập trung viết kịch bản chất lượng cao cho video phân tích xã hội
---

# 🎬 Content Creation Skill System

## Tổng quan

Hệ thống skill này được thiết kế để **viết kịch bản chất lượng cao** cho các kênh nội dung. Mỗi kênh có một bộ skill riêng biệt, được tối ưu hóa cho chủ đề, đối tượng và phong cách riêng.

**Trọng tâm**: Viết kịch bản tốt nhất có thể — mọi nội dung khác (audio, video, post card) là phần mở rộng tùy chọn.

## Cấu trúc thư mục

```
skill/
├── SKILL.md                          # File này — tổng quan hệ thống
├── channel-social-analysis/          # Kênh phân tích xã hội
│   ├── channel-profile.md            # Hồ sơ kênh, tông giọng, đối tượng mục tiêu
│   ├── script-framework.md           # Khung kịch bản & quy trình viết
│   ├── hook-templates.md             # Các mẫu mở đầu gây sốc (Hook)
│   ├── power-words-glossary.md       # Bộ từ khóa thu hút & ẩn dụ mạnh
│   ├── postcard-template.md          # Template thiết kế post card (tùy chọn)
│   ├── youtube-video-template.md     # Template sản xuất YouTube video (tùy chọn)
│   └── output/                       # Thư mục chứa file xuất ra
└── [channel-khác]/                   # Các kênh khác (mở rộng sau)
```

## Quy trình Viết Kịch bản

```
┌─────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  1. NGHIÊN  │───▶│  2. VIẾT     │───▶│  3. REVIEW   │───▶│  4. XUẤT     │
│  CỨU ĐỀ TÀI│    │  KỊCH BẢN    │    │  & POLISH    │    │  FILE        │
└─────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
      │                   │                   │                   │
  Xác định            Áp dụng            Đọc to,             Xuất 2 file:
  nghịch lý,          khung kịch         cắt câu thừa,       - kịch bản .txt
  thu thập            bản, hook,         kiểm tra            - tiêu đề .txt
  dữ liệu            power words        checklist
```

### Bước 1: Nghiên cứu đề tài
- Xác định **nghịch lý thực tế** (xem `hook-templates.md`)
- Thu thập **dữ liệu biết nói** từ nguồn uy tín
- Xác định **3-4 "cơn bão ngầm"** để triển khai

### Bước 2: Viết kịch bản
- Sử dụng **khung kịch bản** từ `script-framework.md`
- Áp dụng **hồ sơ kênh** từ `channel-profile.md` để đúng tông giọng
- Xen kẽ **power words** từ `power-words-glossary.md`
- **Viết thuần chữ, TTS-friendly**: không viết tắt (thành phố Hồ Chí Minh chứ không TP.HCM), không ký tự đặc biệt (dấu phẩy thay em dash), số viết bằng chữ (50 phần trăm chứ không 50%)
- Thêm **2 đoạn Disclaimer bắt buộc**: Background Listening (sau Hook) + Nguồn tổng hợp (trước câu kết)

### Bước 3: Review & Polish
- Đọc to toàn bộ kịch bản, mỗi câu phải khiến người nghe muốn nghe câu tiếp theo
- Cắt mọi câu thừa thãi
- Kiểm tra **TTS-friendly**: không còn viết tắt, ký tự đặc biệt, em dash
- Kiểm tra **2 đoạn Disclaimer** đã có
- Kiểm tra checklist chất lượng (xem `channel-profile.md` phần 6)

### Bước 4: Xuất file
- Xuất ra **2 file .txt**:
  - **Kịch bản**: `kich-ban-[tên-chủ-đề].txt` — chỉ chứa nội dung kịch bản thuần chữ
  - **Tiêu đề & Assets**: `tieu-de-[tên-chủ-đề].txt` — tiêu đề, description, prompt video, prompt ảnh

## Output Format — 2 File .txt

### File 1: Kịch bản (`kich-ban-[tên].txt`)

Yêu cầu:
- **Chỉ có chữ**, không markdown, không ký hiệu, không annotation
- **TTS-friendly**: không viết tắt, không ký tự đặc biệt, không em dash (xem bảng chuyển đổi trong `script-framework.md`)
- **2 đoạn Disclaimer bắt buộc**: Background Listening (sau Hook) + Nguồn tổng hợp (trước câu kết)
- Sẵn sàng để đọc thành lời hoặc đưa vào bất kỳ TTS engine nào
- Chia đoạn rõ ràng bằng dòng trống giữa các phần

### File 2: Tiêu đề & Assets (`tieu-de-[tên].txt`)

Bao gồm 4 phần, phân cách bằng `============================`:

**Phần 1 — Tiêu đề video (3-5 gợi ý)**
- Theo công thức: `[Số liệu sốc] + [Nghịch lý] + [Lời hứa giải mã]`
- Tối đa 80 ký tự mỗi tiêu đề
- 1-2 từ VIẾT HOA để nhấn mạnh

**Phần 2 — Description chuẩn SEO YouTube**
- Hook 2-3 câu tóm tắt nghịch lý chính
- Timestamps đầy đủ theo phần kịch bản
- Nguồn tham khảo có link
- CTA + hashtags (8-12 hashtags)

**Phần 3 — 2 Prompt video hook (cho Veo3)**
- Mỗi prompt mô tả chi tiết: Subject, Action, Camera movement, Style, Color grading, Sound
- Tối ưu cho Veo3: cinematic, cụ thể, có chỉ dẫn camera và ánh sáng
- Phong cách: moody, dramatic, visual metaphor mạnh

**Phần 4 — 50 Prompt ảnh minh họa (cho Google Imagen)**
- Theo trình tự kịch bản: Hook → Bridge → Storm 1-3 → Mirror → Blueprint → Close
- Mỗi prompt bao gồm: Subject, Context, Style, Lighting, Color palette, Composition, Aspect ratio
- Tối ưu cho Imagen: photorealistic, specific, positive framing
- Bảng màu nhất quán: deep navy/black + accent vàng/đỏ/teal

## Cách sử dụng

Khi cần tạo kịch bản cho một kênh cụ thể:

1. **Đọc `channel-profile.md`** của kênh tương ứng để nắm bắt tông giọng và đối tượng
2. **Đọc `script-framework.md`** để hiểu cấu trúc kịch bản
3. **Tham khảo `hook-templates.md`** và `power-words-glossary.md` trong quá trình viết
4. **Viết kịch bản thuần chữ** — không markup, không annotation
5. **Xuất 2 file .txt** — kịch bản + tiêu đề

## Automated Script Generation (API Mode)

Khi được gọi từ UI Script Generator, hệ thống skill hoạt động như **prompt context** cho AI:

1. UI gửi: `channelId` + `topic` + `language` → Prompt Builder xây dựng prompt từ skill files
2. AI nhận prompt có chứa: channel profile, script framework, power words, hook templates
3. AI xuất output theo format chuẩn (xem bên dưới)

### Output Format Specification

AI phải trả về response theo format sau, với 2 block rõ ràng:

```
===SCRIPT_START===
[Toàn bộ kịch bản thuần chữ ở đây, không có markup hay annotation]
===SCRIPT_END===

===TITLES_START===
Gợi ý tiêu đề 1
Gợi ý tiêu đề 2
Gợi ý tiêu đề 3
===TITLES_END===
```

### File xuất ra
- **Kịch bản**: `kich-ban-[tên-chủ-đề].txt` — nội dung giữa `===SCRIPT_START===` và `===SCRIPT_END===`
- **Tiêu đề**: `tieu-de-[tên-chủ-đề].txt` — nội dung giữa `===TITLES_START===` và `===TITLES_END===`

---

## Nguyên tắc vàng

> **"Mỗi giây đều phải có giá trị. Nếu một câu không khiến người xem muốn nghe câu tiếp theo, nó không xứng đáng ở đó."**

- 🎯 **Luôn bắt đầu bằng nghịch lý** — không bao giờ mở đầu nhạt nhẽo
- 📊 **Dữ liệu là xương sống** — mỗi luận điểm cần số liệu bảo chứng
- 🌊 **Cảm xúc là dòng chảy** — kịch bản phải tạo sóng cảm xúc lên xuống
- 💡 **Luôn kết bằng hy vọng** — phê phán để xây dựng, không phải để hủy hoại
- 🔄 **Tương tác là cầu nối** — mỗi video phải có ít nhất 2 câu hỏi cho người xem
- ✍️ **Thuần chữ là vua** — kịch bản tốt chỉ cần chữ, không cần markup
