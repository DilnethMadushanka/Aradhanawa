# Cathedral Vows saha Sunset Vows: image + video prompts

Wedding category eke aluth intro video card dekak. Dan site eke thiyenne code eken adapu stand-in images saha
stand-in videos (`scripts/vows_art.mjs`). Pahala prompts walin real ewa generate karala, **eka filename ekatama**
`img/` folder ekata danna. Code wenas karanna one naha.

Hama image prompt ekakatama anthimata: `no text, no letters, no watermark, no logos`.
Video settings hama ekatama: **9:16 vertical, 1080x1920, 8–10 s, 24 fps, no text, no music**.
Video eka MP4 (H.264) karala ~3 MB walata adu karanna. Video ekata poster image ekakuth one (video eke palaweni frame eka hondai).

---

## A. Cathedral Vows (white church, gold, doors open onto the aisle)

**Flow eka:** guest link eka open karama vahala thiyena white & gold church doors dekak penawa, uda names + date.
"Open the doors" tap karama doors deka 3D widihata degodata arila, couple aisle eke yana video eka penawa, names fade in wenawa.
Palette: ivory #FBF8F2, champagne gold #B8964F, warm grey ink #4A4234.

### A1. Closed doors: `img/th-chapel-doors.webp` (1080 x 1920, 9:16)
Meka meda deken kapala doors dekak widihata arinawa. E nisa **meda vertical seam eka hariyatama image eke meda** thiyenna one, symmetrical.
Meda kotasa (uda 35% – 65%) text card ekak wahena nisa eka simple wenna one.
```
Front view of tall closed double doors of a white gothic cathedral, perfectly symmetrical, the vertical seam between the two doors exactly in the centre of the frame, ivory white carved wood panels with fine champagne gold mouldings and gold quatrefoil medallions, a pointed stone arch framing the doors, two round antique gold ring handles near the centre, soft white roses and baby's breath arranged at the foot of each door, soft diffused daylight, clean bright airy mood, elegant wedding photography, straight-on camera, 9:16
```

### A2. Aisle video: `img/th-chapel.mp4` (+ `img/th-chapel-480.mp4` small copy) + poster `img/th-chapel-poster.webp` (720 x 1280) + `img/th-chapel-poster-480.webp`
Doors arila iwara wenakotama penena scene eka. Couple screen eke yata bage, uda kotasa (names yanawa) light church ceiling.
```
Cinematic slow forward dolly shot down the centre aisle of a bright white gothic cathedral, camera starting just inside the open doors and gliding slowly forward. A young Sri Lankan bride and groom walk away from the camera hand in hand toward the altar: the bride in a white lace wedding gown with a long cathedral veil trailing on a white aisle runner, the groom in a charcoal grey tailored suit. Tall pointed arches, a large round rose window glowing with soft light above the altar, wooden pews on both sides decorated with white roses, hydrangeas and greenery, soft god rays through high windows, airy ivory and champagne gold colour grade, dreamy romantic mood. The couple stays in the lower half of the frame; the upper half is calm ceiling and rose window (space for text). Smooth, slow, elegant motion, photorealistic, 4K, film look.
```
Negative: `text, words, letters, logos, watermark, fast motion, camera shake, guests looking at camera, distorted faces, extra limbs, cartoon, oversaturated, dark`

Tip (closest look): A2 prompt eken mulin still image ekak hadala (Midjourney / ChatGPT / Gemini), eka image-to-video (Kling / Veo) walata danna, motion prompt: `slow forward dolly down the aisle, veil gently flowing, couple walking slowly`.
Small copy: `ffmpeg -i th-chapel.mp4 -vf scale=480:-2 -crf 30 -an th-chapel-480.mp4`

### A3. Side flowers: `img/th-chapel-l.webp` saha `img/th-chapel-r.webp` (560 x 840, transparent PNG)
Video eka uda corners walin ellena mal. Left eka hadala, flip karala right eka hadanna.
```
A hanging cascade of white garden roses, white hydrangea, baby's breath, eucalyptus leaves and a few champagne gold leaves, hanging down from the top left corner only, the rest of the image completely empty, isolated on a transparent background (PNG), elegant wedding floral, soft shadows, 2:3
```
(Transparent ena nathi tool ekak nam plain solid #FFFFFF background ekak illanna, mama cut karannam.)

### A4. Couple picture: `img/th-chapel-hero-960.webp` + `-480` (960 x 717, 4:3)
Invitation eke details kotase penena photo eka.
```
Elegant portrait of a young Sri Lankan couple on their church wedding day, the bride in a white lace gown and long veil holding a bouquet of white roses, the groom in a charcoal grey suit with a white rose boutonniere, standing close and smiling at each other in front of a softly blurred white cathedral interior with arched windows, soft natural light, ivory and gold tones, romantic editorial photography, shallow depth of field, couple centred, 4:3
```

### A5. Venue picture: `img/th-chapel-venue.webp` (900 x 672, 4:3)
```
Elegant champagne gold line-art illustration of a small white gothic church with a pointed bell tower, a round rose window and an arched front door, on a plain ivory background, small clusters of white roses at both sides of the base, minimal and symmetrical, invitation card style, 4:3
```

---

## B. Sunset Vows (vintage car, hill country sunset, bouquet toss, petal burst)

**Flow eka:** guest link eka open karama couple vintage car eke hill country sunset ekak athare yana video eka play wenawa.
Bride bouquet eka uda dagana welawe names fade in wenawa. "Open invitation" tap karama sudu/rosa mal pethi burst ekak screen eka purawala invitation ekata yanawa.
Palette: warm cream #FFF5EC, sunset copper #C98B4A, deep terracotta ink #7A3B2A.

### B1. Drive video: `img/th-sunset.mp4` (+ `img/th-sunset-480.mp4`) + poster `img/th-sunset-poster.webp` (720 x 1280) + `img/th-sunset-poster-480.webp`
Names video eke uda kotase 2–4 s athara penawa. Bouquet toss eka ~5–7 s athara thiyenna hondai.
```
Cinematic front view of a cream white 1950s vintage convertible car with chrome grille and round headlights, driving slowly toward the camera on a stone terrace road in the Sri Lankan hill country at golden sunset. A young Sri Lankan couple sits in the front: the bride in a white and gold Kandyan osariya saree with traditional gold jewellery and a white flower bouquet, the groom in a white national suit. They smile at each other, then the bride joyfully tosses her white bouquet up into the air and a few soft petals scatter. Behind them misty layered hills, green tea terraces and a glowing orange and pink sky with the sun near the horizon, warm lens flare, soft haze. The car stays in the lower half of the frame; the upper half is open sunset sky (space for text). Smooth, slow, romantic motion, photorealistic, 4K, warm film colour grade.
```
Negative: `text, words, letters, logos, number plate text, watermark, fast motion, camera shake, extra cars, extra people, distorted faces, extra fingers, cartoon, oversaturated`

Tip: mulin still ekak hadala image-to-video danna, motion prompt: `car rolls slowly forward, couple smiling, bride tosses the bouquet into the air, petals drifting, warm sunset light`.
Small copy: `ffmpeg -i th-sunset.mp4 -vf scale=480:-2 -crf 30 -an th-sunset-480.mp4`

### B2. Side flowers: `img/th-sunset-l.webp` saha `img/th-sunset-r.webp` (about 520 x 560, transparent PNG)
```
A corner arrangement of blush pink and peach garden roses, white frangipani (araliya) and small green tropical leaves, coming in from the top left corner only, the rest of the image completely empty, isolated on a transparent background (PNG), warm golden light, elegant wedding floral, soft shadows, 1:1
```

### B3. Couple picture: `img/th-sunset-hero-960.webp` + `-480` (960 x 717, 4:3)
```
Romantic portrait of a young Sri Lankan couple standing beside a cream vintage convertible on a hill country road at golden sunset, the bride in a white and gold Kandyan osariya saree with traditional gold jewellery holding a white flower bouquet, the groom in a white national suit, laughing together, misty hills and tea terraces softly blurred behind, warm backlight and lens flare, editorial wedding photography, shallow depth of field, couple centred, 4:3
```

### B4. Venue picture: `img/th-sunset-venue.webp` (900 x 672, 4:3)
```
Soft watercolour illustration of a colonial hill country bungalow hotel with a stone balustrade terrace overlooking misty green tea estates at sunset, warm peach and pink sky, a few white flowers in the foreground, calm and elegant, invitation card style, 4:3
```

---

## Upload karala passe
1. Files okkoma `img/` ekata eka namatama danna (webp nathnam PNG/JPG dunnath mama convert karannam).
2. Stand-in ewa replace wenawa. `scripts/vows_art.mjs` aye run kalath thiyena files wenas karanne naha (`FORCE=1` dunnoth vitharai).
