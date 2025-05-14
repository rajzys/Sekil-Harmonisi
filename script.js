document.addEventListener('DOMContentLoaded', () => {                                   
    // Kanvas ve Bağlam
    const gameCanvas = document.getElementById('game-canvas');
    const ctx = gameCanvas.getContext('2d');

    // Arayüz Elemanları
    const levelDisplay = document.getElementById('level-display');
    const instructionsDisplay = document.getElementById('instructions');
    const shapePaletteCanvas = document.createElement('canvas'); // Palet için bir kanvas oluştur
    const shapePaletteContainer = document.getElementById('shape-palette');
    
    // Kontrol Butonları
    const checkSolutionBtn = document.getElementById('check-solution-btn');
    const resetLevelBtn = document.getElementById('reset-level-btn');
    const nextLevelBtn = document.getElementById('next-level-btn');
    const undoBtn = document.getElementById('undo-btn');
    
    // Seviye Seçme UI
    const levelSelectBtn = document.getElementById('level-select-btn');
    const levelDropdown = document.getElementById('level-dropdown');

    // Game State
    let currentLevelIndex = 0;
    let placedShapes = []; // Oyuncu tarafından yerleştirilen şekilleri saklamak için
    let selectedShapeToRotate = null; // Zaten yerleştirilmiş şekilleri döndürmeye izin vermek için (gelecek)
    let draggedShape = null;
    let draggedShapeIndex = -1; // Sürüklenen şeklin indeksi (eğer placedShapes'den ise)
    let dragOffsetX, dragOffsetY;
    const ROTATION_STEP = 15; // Daha hassas rotasyon için adımı düşürdük (önceki değer: 30)
    const FINE_ROTATION_STEP = 5; // Çok hassas döndürme için daha küçük adım
    const TARGET_AREA_OFFSET_X = 20; // Hedef alan için gameCanvas içindeki dolgu
    const TARGET_AREA_OFFSET_Y = 20;
    const SNAP_GRID_SIZE = 5; // Hedef alan içinde 5px'lik ızgaraya yerleştirme (önceki değer: 5)
    let currentShapeInSequenceIndex = 0;
    let availableShapes = []; // Orijinal şekillerin tam kopyaları
    let availableShapeTypes = []; // Her şekil tipinden birer örnek
    let selectedShapeIndex = 0; // Şu anda seçili olan şekli takip et
    let highlightedShapeIndex = -1; // Vurgulanacak şeklin placedShapes içindeki indeksi
    let highlightTimeoutId = null;

    // --- Level Definitions ---
    const levels = [
        {
            levelNumber: 1,
            targetArea: { type: 'square', width: 100, height: 100, color: '#ddd' }, 
            shapeSequence: [
                { type: 'square', size: 50, color: 'lightblue', rotation: 0, vertices: [] },
                { type: 'square', size: 25, color: 'lightcoral', rotation: 0, vertices: [] },
                { type: 'rectangle', width: 50, height: 25, color: 'lightgreen', rotation: 0, vertices: [] },
                { type: 'rectangle', width: 25, height: 50, color: 'lightyellow', rotation: 0, vertices: [] },
                { type: 'square', size: 50, color: 'lavender', rotation: 0, vertices: [] },
                { type: 'square', size: 25, color: 'thistle', rotation: 0, vertices: [] }
            ],
            message: "SEVİYE 1: 100x100 kare alanı, kare ve dikdörtgenler kullanarak örüntülü şekilde kaplayın." 
        },
        {
            levelNumber: 2,
            targetArea: { type: 'rectangle', width: 200, height: 100, color: '#d8d8d8' }, 
            shapeSequence: [
                { type: 'rectangle', width: 100, height: 50, color: 'lightgreen', rotation: 0, vertices: [] },
                { type: 'rectangle', width: 50, height: 50, color: 'lightpink', rotation: 0, vertices: [] },
                { type: 'square', size: 50, color: 'lavender', rotation: 0, vertices: [] },
                { type: 'square', size: 25, color: 'lightskyblue', rotation: 0, vertices: [] },
                { type: 'rectangle', width: 25, height: 50, color: 'peachpuff', rotation: 0, vertices: [] }
            ],
            message: "SEVİYE 2: 200x100 dikdörtgen alanı, kare ve dikdörtgenlerle örüntü oluşturacak şekilde kaplayın." 
        },
        {
            levelNumber: 3,
            targetArea: { type: 'rectangle', width: 100, height: 250, color: '#e0e0e0' }, 
            shapeSequence: [
                { type: 'rectangle', width: 50, height: 100, color: 'salmon', rotation: 0, vertices: [] },
                { type: 'rectangle', width: 100, height: 50, color: 'skyblue', rotation: 0, vertices: [] },
                { type: 'square', size: 50, color: 'lightgreen', rotation: 0, vertices: [] },
                { type: 'square', size: 50, color: 'gold', rotation: 0, vertices: [] },
                { type: 'rectangle', width: 25, height: 75, color: 'plum', rotation: 0, vertices: [] }
            ],
            message: "SEVİYE 3: 100x250 dikdörtgen alanı, kare ve dikdörtgenlerle örüntü oluşturarak kaplayın." 
        },
        {
            levelNumber: 4,
            targetArea: { type: 'rectangle', width: 200, height: 250, color: '#d5d5d5' }, 
            shapeSequence: [
                { type: 'rectangle', width: 100, height: 50, color: 'purple', rotation: 0, vertices: [] },
                { type: 'rectangle', width: 50, height: 100, color: 'indigo', rotation: 0, vertices: [] },
                { type: 'rectangle', width: 50, height: 50, color: 'darkslateblue', rotation: 0, vertices: [] },
                { type: 'square', size: 50, color: 'violet', rotation: 0, vertices: [] },
                { type: 'square', size: 25, color: 'pink', rotation: 0, vertices: [] },
                { type: 'rectangle', width: 75, height: 25, color: 'lightsalmon', rotation: 0, vertices: [] }
            ],
            message: "SEVİYE 4: 200x250 dikdörtgen alanı, dikdörtgen ve kareler ile kaplayın." 
        },
        {
            levelNumber: 5,
            targetArea: { type: 'rectangle', width: 300, height: 150, color: '#cccccc' }, 
            shapeSequence: [
                { type: 'rectangle', width: 150, height: 50, color: 'teal', rotation: 0, vertices: [] },
                { type: 'rectangle', width: 150, height: 50, color: 'cyan', rotation: 0, vertices: [] },
                { type: 'square', size: 50, color: 'aqua', rotation: 0, vertices: [] },
                { type: 'square', size: 50, color: 'paleturquoise', rotation: 0, vertices: [] },
                { type: 'square', size: 50, color: 'mediumaquamarine', rotation: 0, vertices: [] },
                { type: 'rectangle', width: 150, height: 50, color: 'turquoise', rotation: 0, vertices: [] },
                { type: 'rectangle', width: 150, height: 50, color: 'crimson', rotation: 0, vertices: [] },
                { type: 'rectangle', width: 150, height: 50, color: 'firebrick', rotation: 0, vertices: [] },
                { type: 'square', size: 50, color: 'gold', rotation: 0, vertices: [] },
                { type: 'square', size: 50, color: 'orange', rotation: 0, vertices: [] }
            ],
            message: "SEVİYE 5: 300x150 dikdörtgen alanı, kare ve dikdörtgenlerle örüntü oluşturacak şekilde döşeyin." 
        },
        {
            levelNumber: 6,
            targetArea: { type: 'square', width: 200, height: 200, color: '#c0c0c0' }, 
            shapeSequence: [
                { type: 'rectangle', width: 100, height: 50, color: 'sienna', rotation: 0, vertices: [] },
                { type: 'rectangle', width: 50, height: 100, color: 'chocolate', rotation: 0, vertices: [] },
                { type: 'square', size: 50, color: 'peru', rotation: 0, vertices: [] },
                { type: 'square', size: 50, color: 'burlywood', rotation: 0, vertices: [] },
                { type: 'rectangle', width: 100, height: 25, color: 'tan', rotation: 0, vertices: [] },
                { type: 'rectangle', width: 25, height: 100, color: 'darkgoldenrod', rotation: 0, vertices: [] },
                { type: 'rectangle', width: 50, height: 50, color: 'olive', rotation: 0, vertices: [] },
                { type: 'square', size: 25, color: 'goldenrod', rotation: 0, vertices: [] }
            ],
            message: "SEVİYE 6: 200x200 kare alanı, kare ve dikdörtgenlerle döşeyerek örüntü oluşturun."
        },
        {
            levelNumber: 7,
            targetArea: { type: 'square', width: 250, height: 250, color: '#d0d0d0' }, 
            shapeSequence: [
                { type: 'isoscelesRightTriangle', leg: 50, color: 'mediumseagreen', rotation: 0, vertices: [] },
                { type: 'isoscelesRightTriangle', leg: 50, color: 'forestgreen', rotation: 90, vertices: [] },
                { type: 'isoscelesRightTriangle', leg: 50, color: 'darkseagreen', rotation: 180, vertices: [] },
                { type: 'isoscelesRightTriangle', leg: 50, color: 'springgreen', rotation: 270, vertices: [] },
                { type: 'rectangle', width: 125, height: 75, color: 'slateblue', rotation: 0, vertices: [] },
                { type: 'rectangle', width: 125, height: 75, color: 'mediumpurple', rotation: 90, vertices: [] },
                { type: 'isoscelesRightTriangle', leg: 125, color: 'indianred', rotation: 0, vertices: [] }, // Kenar: 125 piksel
                { type: 'isoscelesRightTriangle', leg: 125, color: 'lightcoral', rotation: 90, vertices: [] },
                { type: 'isoscelesRightTriangle', leg: 125, color: 'firebrick', rotation: 180, vertices: [] },
                { type: 'isoscelesRightTriangle', leg: 125, color: 'crimson', rotation: 270, vertices: [] }
            ],
            message: "SEVİYE 7: 250x250 kare alanı, dik üçgenler ve dikdörtgenlerle kaplayın."
        },
        // 17 yaşındakiler için daha zorlayıcı yeni seviyeler
        {
            levelNumber: 8,
            targetArea: { type: 'rectangle', width: 300, height: 200, color: '#c8c8c8' },
            shapeSequence: [
                { type: 'isoscelesRightTriangle', leg: 100, color: 'palevioletred', rotation: 0, vertices: [] },
                { type: 'isoscelesRightTriangle', leg: 100, color: 'lightpink', rotation: 90, vertices: [] },
                { type: 'isoscelesRightTriangle', leg: 100, color: 'hotpink', rotation: 180, vertices: [] },
                { type: 'isoscelesRightTriangle', leg: 100, color: 'deeppink', rotation: 270, vertices: [] },
                { type: 'square', size: 50, color: 'lavender', rotation: 0, vertices: [] },
                { type: 'square', size: 50, color: 'rebeccapurple', rotation: 45, vertices: [] },
                { type: 'rectangle', width: 100, height: 50, color: 'thistle', rotation: 0, vertices: [] }
            ],
            message: "SEVİYE 8: 300x200 dikdörtgen alanın en az %85'ini kaplayın. Daha fazla kaplama = daha çok yıldız!"
        },
        {
            levelNumber: 9,
            targetArea: { type: 'square', width: 250, height: 250, color: '#d0d0d0' },
            shapeSequence: [
                { type: 'equilateralTriangle', side: 75, color: 'royalblue', rotation: 0, vertices: [] },
                { type: 'equilateralTriangle', side: 75, color: 'cornflowerblue', rotation: 60, vertices: [] },
                { type: 'equilateralTriangle', side: 75, color: 'lightblue', rotation: 120, vertices: [] },
                { type: 'equilateralTriangle', side: 75, color: 'skyblue', rotation: 180, vertices: [] },
                { type: 'equilateralTriangle', side: 75, color: 'deepskyblue', rotation: 240, vertices: [] },
                { type: 'equilateralTriangle', side: 75, color: 'lightsteelblue', rotation: 300, vertices: [] },
                { type: 'hexagon', side: 40, color: 'steelblue', rotation: 0, vertices: [] }
            ],
            message: "SEVİYE 9: 250x250 kare alanın en az %85'ini kaplayın. Verilen şekillerle alanın en az %85'ini kaplayın. %90+ kaplama = 2 yıldız, %95+ kaplama = 3 yıldız!"
        },
        {
            levelNumber: 10,
            targetArea: { type: 'rectangle', width: 300, height: 240, color: '#c5c5c5' },
            shapeSequence: [
                { type: 'hexagon', side: 40, color: 'seagreen', rotation: 0, vertices: [] },
                { type: 'hexagon', side: 40, color: 'mediumseagreen', rotation: 0, vertices: [] },
                { type: 'hexagon', side: 40, color: 'darkgreen', rotation: 0, vertices: [] },
                { type: 'hexagon', side: 40, color: 'limegreen', rotation: 0, vertices: [] },
                { type: 'hexagon', side: 40, color: 'forestgreen', rotation: 0, vertices: [] },
                { type: 'hexagon', side: 40, color: 'green', rotation: 0, vertices: [] },
                { type: 'equilateralTriangle', side: 40, color: 'lightgreen', rotation: 0, vertices: [] },
                { type: 'equilateralTriangle', side: 40, color: 'palegreen', rotation: 60, vertices: [] },
                { type: 'equilateralTriangle', side: 40, color: 'yellowgreen', rotation: 120, vertices: [] },
                { type: 'equilateralTriangle', side: 40, color: 'olivedrab', rotation: 180, vertices: [] },
                { type: 'equilateralTriangle', side: 40, color: 'darkolivegreen', rotation: 240, vertices: [] },
                { type: 'equilateralTriangle', side: 40, color: 'forestgreen', rotation: 300, vertices: [] },
                { type: 'equilateralTriangle', side: 40, color: 'lime', rotation: 0, vertices: [] },
                { type: 'equilateralTriangle', side: 40, color: 'greenyellow', rotation: 60, vertices: [] },
                { type: 'equilateralTriangle', side: 40, color: 'chartreuse', rotation: 120, vertices: [] }
            ],
            message: "SEVİYE 10: 300x240 alanın en az %85'ini kaplayın. Üçgensel-Altıgen kaplama (Trihexagonal tiling) yapın. Altıgenleri düzenli şekilde yerleştirip, aralarındaki üçgen boşlukları eşkenar üçgenlerle doldurun! İpucu: Altıgenlerin kenarı ile üçgenlerin kenarı aynı olmalı (40px)."
        },
        {
            levelNumber: 11,
            targetArea: { type: 'square', width: 300, height: 300, color: '#d2d2d2' },
            shapeSequence: [
                { type: 'pentagon', side: 50, color: 'coral', rotation: 0, vertices: [] },
                { type: 'pentagon', side: 50, color: 'salmon', rotation: 36, vertices: [] },
                { type: 'rhombus', side: 50, color: 'lightsalmon', rotation: 0, vertices: [] },
                { type: 'rhombus', side: 50, color: 'darksalmon', rotation: 45, vertices: [] },
                { type: 'equilateralTriangle', side: 75, color: 'tomato', rotation: 0, vertices: [] },
                { type: 'equilateralTriangle', side: 75, color: 'orangered', rotation: 60, vertices: [] },
                { type: 'isoscelesRightTriangle', leg: 75, color: 'firebrick', rotation: 0, vertices: [] },
                { type: 'isoscelesRightTriangle', leg: 75, color: 'crimson', rotation: 90, vertices: [] }
            ],
            message: "SEVİYE 11: 300x300 kare alanın en az %85'ini kaplayın. Simetrik bir geometrik mozaik desen oluşturun. Beşgenleri ortaya, çevresine eşkenar dörtgen ve üçgenler yerleştirin. 3 yıldız için %95+ kaplama gerekir!"
        },
        {
            levelNumber: 12,
            targetArea: { type: 'square', width: 350, height: 350, color: '#c0c0c0' },
            shapeSequence: [
                { type: 'pentagon', side: 60, color: 'gold', rotation: 0, vertices: [] },
                { type: 'hexagon', side: 50, color: 'goldenrod', rotation: 0, vertices: [] },
                { type: 'isoscelesRightTriangle', leg: 100, color: 'khaki', rotation: 0, vertices: [] },
                { type: 'isoscelesRightTriangle', leg: 100, color: 'darkkhaki', rotation: 90, vertices: [] },
                { type: 'isoscelesRightTriangle', leg: 100, color: 'palegoldenrod', rotation: 180, vertices: [] },
                { type: 'isoscelesRightTriangle', leg: 100, color: 'yellow', rotation: 270, vertices: [] },
                { type: 'rhombus', side: 70, color: 'lemonchiffon', rotation: 0, vertices: [] },
                { type: 'equilateralTriangle', side: 90, color: 'peachpuff', rotation: 0, vertices: [] },
                { type: 'equilateralTriangle', side: 90, color: 'sandybrown', rotation: 60, vertices: [] }
            ],
            message: "SEVİYE 12: 350x350 kare alanın en az %85'ini kaplayın. Merkezdeki beşgen ve altıgenden dışa doğru yayılan ışınsal bir desen oluşturun. Mümkün olduğunca fazla alanı kaplayarak daha çok yıldız kazanın!"
        },
        {
            levelNumber: 13,
            targetArea: { type: 'rectangle', width: 400, height: 300, color: '#b8b8b8' },
            shapeSequence: [
                { type: 'pentagon', side: 50, color: 'teal', rotation: 0, vertices: [] },
                { type: 'pentagon', side: 50, color: 'darkturquoise', rotation: 36, vertices: [] },
                { type: 'hexagon', side: 40, color: 'turquoise', rotation: 0, vertices: [] },
                { type: 'hexagon', side: 40, color: 'mediumturquoise', rotation: 30, vertices: [] },
                { type: 'equilateralTriangle', side: 70, color: 'lightseagreen', rotation: 0, vertices: [] },
                { type: 'equilateralTriangle', side: 70, color: 'cadetblue', rotation: 60, vertices: [] },
                { type: 'rhombus', side: 60, color: 'mediumaquamarine', rotation: 0, vertices: [] },
                { type: 'rhombus', side: 60, color: 'aquamarine', rotation: 45, vertices: [] },
                { type: 'isoscelesRightTriangle', leg: 70, color: 'paleturquoise', rotation: 0, vertices: [] },
                { type: 'isoscelesRightTriangle', leg: 70, color: 'powderblue', rotation: 90, vertices: [] }
            ],
            message: "SEVİYE 13: 400x300 dikdörtgen alanın en az %85'ini kaplayın. Deniz temalı bir mozaik desen oluşturun. Altıgen ve beşgenleri dalgayı andıracak şekilde yerleştirin. Köşelerdeki boşluklara dikkat edin ve onları doldurmaya çalışın!"
        },
        {
            levelNumber: 14,
            targetArea: { type: 'square', width: 400, height: 400, color: '#a5a5a5' },
            shapeSequence: [
                { type: 'pentagon', side: 60, color: 'slateblue', rotation: 0, vertices: [] },
                { type: 'pentagon', side: 60, color: 'mediumpurple', rotation: 36, vertices: [] },
                { type: 'hexagon', side: 45, color: 'mediumslateblue', rotation: 0, vertices: [] },
                { type: 'hexagon', side: 45, color: 'blueviolet', rotation: 30, vertices: [] },
                { type: 'rhombus', side: 70, color: 'indigo', rotation: 0, vertices: [] },
                { type: 'rhombus', side: 70, color: 'darkviolet', rotation: 45, vertices: [] },
                { type: 'equilateralTriangle', side: 90, color: 'darkorchid', rotation: 0, vertices: [] },
                { type: 'equilateralTriangle', side: 90, color: 'mediumorchid', rotation: 60, vertices: [] },
                { type: 'equilateralTriangle', side: 90, color: 'orchid', rotation: 120, vertices: [] },
                { type: 'isoscelesRightTriangle', leg: 90, color: 'plum', rotation: 0, vertices: [] },
                { type: 'isoscelesRightTriangle', leg: 90, color: 'violet', rotation: 90, vertices: [] },
                { type: 'isoscelesRightTriangle', leg: 90, color: 'thistle', rotation: 180, vertices: [] },
                { type: 'isoscelesRightTriangle', leg: 90, color: 'lavender', rotation: 270, vertices: [] }
            ],
            message: "SEVİYE 14: 400x400 kare alanın en az %85'ini kaplayın. M.C. Escher stilinde karmaşık bir desen oluşturun. Bu son ustalık seviyesinde, %95+ kaplama ile 3 yıldız kazanmaya çalışın! Şekilleri yaratıcı bir şekilde yerleştirerek mümkün olduğunca az boşluk bırakın."
        }
    ];

    // --- Shape Vertex Calculation ---
    function calculateVertices(shape) {
        const { type, x, y, rotation } = shape;
        const angle = rotation * Math.PI / 180; // Radyana çevir
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);
        let points = []; // Şeklin dönüş merkezine göre konumlar

        let cx, cy, w, h;

        if (type === 'square') {
            w = shape.size;
            h = shape.size;
            cx = x + w / 2;
            cy = y + h / 2;
            points = [
                { x: -w / 2, y: -h / 2 }, // Sol üst
                { x:  w / 2, y: -h / 2 }, // Sağ üst
                { x:  w / 2, y:  h / 2 }, // Sağ alt
                { x: -w / 2, y:  h / 2 }  // Sol alt
            ];
        } else if (type === 'rectangle') {
            w = shape.width;
            h = shape.height;
            cx = x + w / 2;
            cy = y + h / 2;
            points = [
                { x: -w / 2, y: -h / 2 }, // Sol üst
                { x:  w / 2, y: -h / 2 }, // Sağ üst
                { x:  w / 2, y:  h / 2 }, // Sağ alt
                { x: -w / 2, y:  h / 2 }  // Sol alt
            ];
        } else if (type === 'equilateralTriangle') {
            const side = shape.side;
            const triHeight = (Math.sqrt(3) / 2) * side;
            
            // İyileştirilmiş merkez hesabı - üçgenin ağırlık merkezi için
            cx = x + side / 2;
            cy = y + (triHeight * 2/3); // Ağırlık merkezi (daha hassas yerleşim için)
            
            // Noktalar, üçgenin ağırlık merkezine göre hesaplanıyor
            points = [
                { x: 0,        y: -triHeight * 2/3 },   // Tepe noktası (üçgenin ağırlık merkezine göre)
                { x: side / 2, y:  triHeight / 3 },     // Sağ alt köşe
                { x: -side/ 2, y:  triHeight / 3 }      // Sol alt köşe
            ];
        } else if (type === 'isoscelesRightTriangle') {
            const leg = shape.leg;
            // x,y bounding box'ın sol üst köşesi. Dönüş merkezi (x + leg/2, y + leg/2)
            cx = x + leg / 2;
            cy = y + leg / 2;
            // Kendi merkezine göre köşeler (merkeze göre (-leg/2, -leg/2) dik açı varsayılır)
            points = [
                { x: -leg / 2, y: -leg / 2 }, // Dik açı köşesi
                { x:  leg / 2, y: -leg / 2 }, // Yatay kenarın ucu
                { x: -leg / 2, y:  leg / 2 }  // Dikey kenarın ucu
            ];
        } else if (type === 'pentagon') {
            const side = shape.side;
            const R = side / (2 * Math.sin(Math.PI / 5));
            const boundingBoxWidth = 2 * R * Math.sin(2 * Math.PI / 5);
            const boundingBoxHeight = R * (1 + Math.cos(Math.PI / 5));
            cx = x + boundingBoxWidth / 2;
            cy = y + boundingBoxHeight / 2;
            for (let i = 0; i < 5; i++) {
                const angle_p = (i * 2 * Math.PI / 5) - (Math.PI / 2); // Point-up
                points.push({ 
                    x: R * Math.cos(angle_p), 
                    y: R * Math.sin(angle_p) 
                });
            }
        } else if (type === 'hexagon') {
            const side = shape.side;
            const boundingBoxWidth = 2 * side;
            const boundingBoxHeight = Math.sqrt(3) * side;
            cx = x + boundingBoxWidth / 2;
            cy = y + boundingBoxHeight / 2;
            for (let i = 0; i < 6; i++) {
                const angle_h = (i * Math.PI / 3) - (Math.PI / 6); // Flat-topped
                points.push({ 
                    x: side * Math.cos(angle_h), 
                    y: side * Math.sin(angle_h) 
                });
            }
        } else if (type === 'rhombus') {
            // 60/120 derecelik açılara sahip eşkenar dörtgen
            const side = shape.side;
            // İki eşkenar üçgenden oluşan bir eşkenar dörtgen için, yükseklik bir üçgen için sqrt(3)*side/2'dir.
            // Eşkenar dörtgenin toplam yüksekliği (uzun köşegen) sqrt(3)*side'dir. Kısa köşegen 'side'dir.
            // Köşe hesaplaması için, x,y sınırlayıcı kutunun sol üst köşesiyse:
            // Sınırlayıcı kutu genişliği = side, Sınırlayıcı kutu yüksekliği = sqrt(3)*side
            // Döndürme merkezi:
            cx = x + side / 2;
            cy = y + (Math.sqrt(3) * side) / 2;
            points = [
                { x: 0,           y: -(Math.sqrt(3) * side) / 2 }, // Üst köşe
                { x: side / 2,    y: 0 },                          // Sağ orta köşe
                { x: 0,           y: (Math.sqrt(3) * side) / 2 },  // Alt köşe
                { x: -side / 2,   y: 0 }                           // Sol orta köşe
            ];
        }
        // Add other shapes here

        shape.vertices = points.map(p => {
            const rotatedX = p.x * cosA - p.y * sinA;
            const rotatedY = p.x * sinA + p.y * cosA;
            return { x: cx + rotatedX, y: cy + rotatedY };
        });
    }


    // --- Shape Drawing Functions ---
    // All drawing functions will now take an optional rotation parameter
    function drawSquare(context, x, y, size, color, rotation = 0) {
        context.save();
        context.translate(x + size / 2, y + size / 2); // Döndürme için merkeze taşı
        context.rotate(rotation * Math.PI / 180);
        context.fillStyle = color;
        context.fillRect(-size / 2, -size / 2, size, size);
        context.strokeStyle = '#333';
        context.strokeRect(-size / 2, -size / 2, size, size);
        context.restore();
    }

    function drawRectangle(context, x, y, width, height, color, rotation = 0) {
        context.save();
        context.translate(x + width / 2, y + height / 2);
        context.rotate(rotation * Math.PI / 180);
        context.fillStyle = color;
        context.fillRect(-width / 2, -height / 2, width, height);
        context.strokeStyle = '#333';
        context.strokeRect(-width / 2, -height / 2, width, height);
        context.restore();
    }

    function drawEquilateralTriangle(context, x, y, side, color, rotation = 0) {
        const height = (Math.sqrt(3) / 2) * side;
        context.save();
        
        // İyileştirilmiş merkez hesabı - üçgenin ağırlık merkezi için
        const centerX = x + side / 2;
        const centerY = y + (height * 2/3);
        
        context.translate(centerX, centerY);
        context.rotate(rotation * Math.PI / 180);
        
        context.beginPath();
        // Ağırlık merkezinden tepe noktasına
        context.moveTo(0, -height * 2/3);
        // Ağırlık merkezinden sağ alt köşeye 
        context.lineTo(side / 2, height / 3);
        // Ağırlık merkezinden sol alt köşeye
        context.lineTo(-side / 2, height / 3);
        context.closePath();
        
        context.fillStyle = color;
        context.fill();
        context.strokeStyle = '#333';
        context.stroke();
        context.restore();
    }

    // Isosceles Right Triangle (legs are equal)
    function drawIsoscelesRightTriangle(context, x, y, leg, color, rotation = 0) {
        context.save();
        // İkizkenar dik üçgen için dik açı köşesine taşımak döndürme için daha kolay olabilir.
        // Veya ağırlık merkezine: dik açı köşesinden (leg/3, leg/3).
        // Şimdilik köşe hesaplamasını basitleştiren bir noktaya taşıyalım.
        // Çizim için, döndürülmemiş durumdaysa x,y'yi bounding box'ın sol üst köşesi olarak kullanacağız.
        context.translate(x + leg / 2, y + leg / 2); 
        context.rotate(rotation * Math.PI / 180);

        context.beginPath();
        // x,y, bounding box'ın sol üst köşesi ve dik açı (x,y)'de olduğunu varsayarsak
        // Merkezlenmiş çizim için ayarlıyoruz:
        context.moveTo(-leg/2, -leg/2); // Merkezlenmiş durumda dik açı köşesi
        context.lineTo(leg/2, -leg/2);  // Yatay kenar
        context.lineTo(-leg/2, leg/2);  // Dikey kenar
        context.closePath();

        context.fillStyle = color;
        context.fill();
        context.strokeStyle = '#333';
        context.stroke();
        context.restore();
    }

    function drawPentagon(context, x, y, side, color, rotation = 0) {
        const R = side / (2 * Math.sin(Math.PI / 5)); // Dış yarıçap
        const r = R * Math.cos(Math.PI / 5);          // İç yarıçap (apothem)
        
        // Döndürülmemiş bir beşgen için sınırlayıcı kutu (yaklaşık, yönelime bağlı)
        // Yukarı bakan bir beşgen için:
        // Genişlik = 2 * R * sin(2*PI/5) = 2 * R * sin(72 derece)
        // Yükseklik = R + r 
        const boundingBoxWidth = 2 * R * Math.sin(2 * Math.PI / 5);
        const boundingBoxHeight = R * (1 + Math.cos(Math.PI / 5));

        const centerX = x + boundingBoxWidth / 2;
        const centerY = y + boundingBoxHeight / 2;

        context.save();
        context.translate(centerX, centerY);
        context.rotate(rotation * Math.PI / 180);

        context.beginPath();
        for (let i = 0; i < 5; i++) {
            // İlk noktanın yukarı gitmesi için açı -PI/2 ile ayarlandı
            const angle = (i * 2 * Math.PI / 5) - (Math.PI / 2); 
            const pointX = R * Math.cos(angle);
            const pointY = R * Math.sin(angle);
            if (i === 0) {
                context.moveTo(pointX, pointY);
            } else {
                context.lineTo(pointX, pointY);
            }
        }
        context.closePath();
        
        context.fillStyle = color;
        context.fill();
        context.strokeStyle = '#333';
        context.stroke();
        context.restore();
    }

    function drawRhombus(context, x, y, side, color, rotation = 0) {
        // 60/120 derecelik açılara sahip eşkenar dörtgen
        const rhombusHeight = Math.sqrt(3) * side; // Bu uzun köşegendir
        const rhombusWidth = side; // Bu kısa köşegendir

        context.save();
        // Döndürme için sınırlayıcı kutunun merkezine taşı
        context.translate(x + rhombusWidth / 2, y + rhombusHeight / 2);
        context.rotate(rotation * Math.PI / 180);

        context.beginPath();
        // Sınırlayıcı kutunun merkezine göre köşeler
        context.moveTo(0, -rhombusHeight / 2); // Üst köşe
        context.lineTo(rhombusWidth / 2, 0);   // Sağ orta köşe
        context.lineTo(0, rhombusHeight / 2);  // Alt köşe
        context.lineTo(-rhombusWidth / 2, 0);  // Sol orta köşe
        context.closePath();

        context.fillStyle = color;
        context.fill();
        context.strokeStyle = '#333';
        context.stroke();
        context.restore();
    }

    function drawHexagon(context, x, y, side, color, rotation = 0) {
        // Döndürülmemiş düz tepeli bir altıgen için sınırlayıcı kutu:
        const boundingBoxWidth = 2 * side;
        const boundingBoxHeight = Math.sqrt(3) * side;

        const centerX = x + boundingBoxWidth / 2;
        const centerY = y + boundingBoxHeight / 2;

        context.save();
        context.translate(centerX, centerY);
        context.rotate(rotation * Math.PI / 180);

        context.beginPath();
        for (let i = 0; i < 6; i++) {
            // Düz tepeli yapmak için açı -PI/6 ile ayarlandı
            const angle = (i * Math.PI / 3) - (Math.PI / 6); 
            const pointX = side * Math.cos(angle);
            const pointY = side * Math.sin(angle);
            if (i === 0) {
                context.moveTo(pointX, pointY);
            } else {
                context.lineTo(pointX, pointY);
            }
        }
        context.closePath();

        context.fillStyle = color;
        context.fill();
        context.strokeStyle = '#333';
        context.stroke();
        context.restore();
    }
    
    // --- Palette Shape Drawing ---
    function drawShapeInPalette() {
        shapePaletteContainer.innerHTML = ''; // Önceki şekil veya içeriği temizle
        const level = levels[currentLevelIndex];
        if (!level || !level.shapeSequence || level.shapeSequence.length === 0) {
            shapePaletteCanvas.width = 150; // Tutarlı boyutu koru
            shapePaletteCanvas.height = 150;
            const paletteCtx = shapePaletteCanvas.getContext('2d');
            paletteCtx.clearRect(0, 0, shapePaletteCanvas.width, shapePaletteCanvas.height);
            paletteCtx.font = "12px Arial";
            paletteCtx.fillStyle = "#888";
            paletteCtx.textAlign = "center";
            paletteCtx.fillText("Şekil Yok", shapePaletteCanvas.width / 2, shapePaletteCanvas.height / 2);
            shapePaletteContainer.appendChild(shapePaletteCanvas); // Canvas'ın DOM'da olduğundan emin ol
            return;
        }

        // Rotasyon bilgisi ekle
        const rotationInfo = document.createElement('div');
        rotationInfo.style.marginBottom = '10px';
        rotationInfo.style.fontSize = '12px';
        rotationInfo.style.padding = '5px';
        rotationInfo.style.backgroundColor = '#f0f0f0';
        rotationInfo.style.borderRadius = '4px';
        rotationInfo.style.textAlign = 'center';
        rotationInfo.innerHTML = 'Şekli döndürmek için: <br>• <b>R</b> tuşu: 15° döndürme<br>• <b>F</b> tuşu: 5° hassas döndürme';
        shapePaletteContainer.appendChild(rotationInfo);

        // Şekil seçim arayüzünü oluştur
        const shapeSelector = document.createElement('div');
        shapeSelector.style.display = 'flex';
        shapeSelector.style.flexWrap = 'wrap';
        shapeSelector.style.justifyContent = 'center';
        shapeSelector.style.marginBottom = '10px';

        // Önceki butonu ekle
        const prevBtn = document.createElement('button');
        prevBtn.textContent = '◀';
        prevBtn.style.marginRight = '10px';
        prevBtn.onclick = () => {
            selectedShapeIndex = (selectedShapeIndex - 1 + availableShapeTypes.length) % availableShapeTypes.length;
            drawShapeInPalette();
        };
        shapeSelector.appendChild(prevBtn);

        // Şekil göstergesini ekle
        const shapeIndicator = document.createElement('span');
        shapeIndicator.textContent = `Şekil ${selectedShapeIndex + 1}/${availableShapeTypes.length}`;
        shapeIndicator.style.margin = '0 10px';
        shapeSelector.appendChild(shapeIndicator);

        // Sonraki butonu ekle
        const nextBtn = document.createElement('button');
        nextBtn.textContent = '▶';
        nextBtn.style.marginLeft = '10px';
        nextBtn.onclick = () => {
            selectedShapeIndex = (selectedShapeIndex + 1) % availableShapeTypes.length;
            drawShapeInPalette();
        };
        shapeSelector.appendChild(nextBtn);

        // Şekil bilgisi ekle
        const shapeTypeInfo = document.createElement('span');
        shapeTypeInfo.style.display = 'block';
        shapeTypeInfo.style.width = '100%';
        shapeTypeInfo.style.textAlign = 'center';
        shapeTypeInfo.style.marginTop = '5px';
        shapeTypeInfo.style.fontSize = '12px';
        shapeTypeInfo.style.color = '#666';
        
        const selectedShape = availableShapeTypes[selectedShapeIndex];
        if (selectedShape.type === 'square') {
            shapeTypeInfo.textContent = `Kare (${selectedShape.size}x${selectedShape.size})`;
        } else if (selectedShape.type === 'rectangle') {
            shapeTypeInfo.textContent = `Dikdörtgen (${selectedShape.width}x${selectedShape.height})`;
        } else if (selectedShape.type === 'equilateralTriangle') {
            shapeTypeInfo.textContent = `Eşkenar Üçgen (Kenar: ${selectedShape.side})`;
        } else if (selectedShape.type === 'isoscelesRightTriangle') {
            shapeTypeInfo.textContent = `Dik Üçgen (Kenar: ${selectedShape.leg})`;
        } else if (selectedShape.type === 'pentagon') {
            shapeTypeInfo.textContent = `Beşgen (Kenar: ${selectedShape.side})`;
        } else if (selectedShape.type === 'hexagon') {
            shapeTypeInfo.textContent = `Altıgen (Kenar: ${selectedShape.side})`;
        } else if (selectedShape.type === 'rhombus') {
            shapeTypeInfo.textContent = `Eşkenar Dörtgen (Kenar: ${selectedShape.side})`;
        }
        
        shapeSelector.appendChild(shapeTypeInfo);

        shapePaletteContainer.appendChild(shapeSelector);

        const shapeToDraw = availableShapeTypes[selectedShapeIndex];
        
        // Büyük şekiller için palette boyutunu ayarla
        let canvasSize = 150; // Standart boyut
        if (shapeToDraw.type === 'isoscelesRightTriangle' && shapeToDraw.leg > 100) {
            // Büyük üçgenler için palette boyutunu arttır
            canvasSize = 200;
        }
        
        shapePaletteCanvas.width = canvasSize;
        shapePaletteCanvas.height = canvasSize;
        const paletteCtx = shapePaletteCanvas.getContext('2d');
        paletteCtx.clearRect(0, 0, shapePaletteCanvas.width, shapePaletteCanvas.height);

        let drawX, drawY;

        if (shapeToDraw.type === 'square') {
            drawX = (shapePaletteCanvas.width - shapeToDraw.size) / 2;
            drawY = (shapePaletteCanvas.height - shapeToDraw.size) / 2;
            drawSquare(paletteCtx, drawX, drawY, shapeToDraw.size, shapeToDraw.color, 0); // Palette'de şekil başlangıçta döndürülmemiş
        } else if (shapeToDraw.type === 'rectangle') {
            drawX = (shapePaletteCanvas.width - shapeToDraw.width) / 2;
            drawY = (shapePaletteCanvas.height - shapeToDraw.height) / 2;
            drawRectangle(paletteCtx, drawX, drawY, shapeToDraw.width, shapeToDraw.height, shapeToDraw.color, 0);
        } else if (shapeToDraw.type === 'equilateralTriangle') {
            const triHeight = (Math.sqrt(3) / 2) * shapeToDraw.side;
            drawX = (shapePaletteCanvas.width - shapeToDraw.side) / 2;
            drawY = (shapePaletteCanvas.height - triHeight) / 2;
            drawEquilateralTriangle(paletteCtx, drawX, drawY, shapeToDraw.side, shapeToDraw.color, 0);
        } else if (shapeToDraw.type === 'isoscelesRightTriangle') {
            let drawLeg = shapeToDraw.leg;
            let scale = 1.0;
            
            // Büyük üçgenler için palette'de ölçekleme
            if (drawLeg > 100) {
                scale = Math.min(140 / drawLeg, 1.0); // Maximum 140px genişlik/yükseklik
                drawLeg = drawLeg * scale; // Görsel çizim için ölçeklendirilmiş kenar
            }
            
            drawX = (shapePaletteCanvas.width - drawLeg) / 2;
            drawY = (shapePaletteCanvas.height - drawLeg) / 2;
            
            // Daha küçük çiziyoruz ama şeklin gerçek değerini koruyoruz
            // Ek bilgi etiketi
            if (scale < 1.0) {
                paletteCtx.font = "10px Arial";
                paletteCtx.fillStyle = "#333";
                paletteCtx.textAlign = "center";
                paletteCtx.fillText(`Gerçek Boyut: ${shapeToDraw.leg}px`, shapePaletteCanvas.width / 2, 20);
            }
            
            // Çizim, gerçek kenar (leg) değil, ölçeklendirilmiş kenar (drawLeg) kullanıyor
            drawIsoscelesRightTriangle(paletteCtx, drawX, drawY, drawLeg, shapeToDraw.color, 0);
        } else if (shapeToDraw.type === 'pentagon') {
            const R_p = shapeToDraw.side / (2 * Math.sin(Math.PI / 5));
            const bbH_p = R_p * (1 + Math.cos(Math.PI / 5));
            const bbW_p = 2 * R_p * Math.sin(2 * Math.PI / 5);
            drawX = (shapePaletteCanvas.width - bbW_p) / 2;
            drawY = (shapePaletteCanvas.height - bbH_p) / 2;
            drawPentagon(paletteCtx, drawX, drawY, shapeToDraw.side, shapeToDraw.color, 0);
        } else if (shapeToDraw.type === 'hexagon') {
            const bbW_h = 2 * shapeToDraw.side;
            const bbH_h = Math.sqrt(3) * shapeToDraw.side;
            drawX = (shapePaletteCanvas.width - bbW_h) / 2;
            drawY = (shapePaletteCanvas.height - bbH_h) / 2;
            drawHexagon(paletteCtx, drawX, drawY, shapeToDraw.side, shapeToDraw.color, 0);
        } else if (shapeToDraw.type === 'rhombus') {
            const rhombusDrawHeight = Math.sqrt(3) * shapeToDraw.side;
            const rhombusDrawWidth = shapeToDraw.side;
            drawX = (shapePaletteCanvas.width - rhombusDrawWidth) / 2;
            drawY = (shapePaletteCanvas.height - rhombusDrawHeight) / 2;
            drawRhombus(paletteCtx, drawX, drawY, shapeToDraw.side, shapeToDraw.color, 0);
        }
        // Diğer şekilleri buraya ekle
        shapePaletteContainer.appendChild(shapePaletteCanvas); // Canvas'ın DOM'da olduğundan emin ol
    }


    // --- Game Area Drawing ---
    function drawTargetArea(area) {
        // Hedef alana göre tuval boyutlarını ayarla, biraz dolgu ile
        gameCanvas.width = area.width + TARGET_AREA_OFFSET_X * 2; 
        gameCanvas.height = area.height + TARGET_AREA_OFFSET_Y * 2; 
        
        ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height); // Tuvali temizle

        // Hedef alanı ortala
        // Hedef alanın kendisi döndürülmüyor, bu yüzden rotasyon parametresi 0 veya atlanıyor
        if (area.type === 'square') {
            drawSquare(ctx, TARGET_AREA_OFFSET_X, TARGET_AREA_OFFSET_Y, area.width, area.color, 0);
        } else if (area.type === 'rectangle') {
            drawRectangle(ctx, TARGET_AREA_OFFSET_X, TARGET_AREA_OFFSET_Y, area.width, area.height, area.color, 0);
        }
        // Diğer alan şekillerini buraya ekle

        // Izgara çizgilerini çiz
        ctx.strokeStyle = '#e0e0e0'; // Izgara çizgileri için açık gri
        ctx.lineWidth = 0.5;

        for (let gx = TARGET_AREA_OFFSET_X + SNAP_GRID_SIZE; gx < TARGET_AREA_OFFSET_X + area.width; gx += SNAP_GRID_SIZE) {
            ctx.beginPath();
            ctx.moveTo(gx, TARGET_AREA_OFFSET_Y);
            ctx.lineTo(gx, TARGET_AREA_OFFSET_Y + area.height);
            ctx.stroke();
        }
        for (let gy = TARGET_AREA_OFFSET_Y + SNAP_GRID_SIZE; gy < TARGET_AREA_OFFSET_Y + area.height; gy += SNAP_GRID_SIZE) {
            ctx.beginPath();
            ctx.moveTo(TARGET_AREA_OFFSET_X, gy);
            ctx.lineTo(TARGET_AREA_OFFSET_X + area.width, gy);
            ctx.stroke();
        }
        ctx.lineWidth = 1; // Diğer çizimler için çizgi kalınlığını sıfırla (gerekirse)
    }

    function redrawCanvas() {
        const level = levels[currentLevelIndex];
        drawTargetArea(level.targetArea); // Bu zaten tuvali temizliyor

        // Yerleştirilmiş şekilleri çiz
        placedShapes.forEach((shape, index) => {
            calculateVertices(shape); // Yerleştirilmiş şekiller için köşeleri hesapla
            
            const originalStrokeStyle = ctx.strokeStyle;
            const originalLineWidth = ctx.lineWidth;

            if (index === highlightedShapeIndex) {
                ctx.strokeStyle = 'lime'; // Vurgulama rengi
                ctx.lineWidth = 2.5;
            } else {
                ctx.strokeStyle = '#333'; // Varsayılan kontur rengi
                ctx.lineWidth = 1;
            }

            if (shape.type === 'square') {
                drawSquare(ctx, shape.x, shape.y, shape.size, shape.color, shape.rotation);
            } else if (shape.type === 'rectangle') {
                drawRectangle(ctx, shape.x, shape.y, shape.width, shape.height, shape.color, shape.rotation);
            } else if (shape.type === 'equilateralTriangle') {
                drawEquilateralTriangle(ctx, shape.x, shape.y, shape.side, shape.color, shape.rotation);
            } else if (shape.type === 'isoscelesRightTriangle') {
                drawIsoscelesRightTriangle(ctx, shape.x, shape.y, shape.leg, shape.color, shape.rotation);
            } else if (shape.type === 'pentagon') {
                drawPentagon(ctx, shape.x, shape.y, shape.side, shape.color, shape.rotation);
            } else if (shape.type === 'hexagon') {
                drawHexagon(ctx, shape.x, shape.y, shape.side, shape.color, shape.rotation);
            }
            
            ctx.strokeStyle = originalStrokeStyle; // Varsayılana sıfırla
            ctx.lineWidth = originalLineWidth; // Varsayılana sıfırla
            // Diğer şekilleri ekle

            // İsteğe bağlı: Hata ayıklama için köşeleri çiz
            // if (shape.vertices && shape.vertices.length > 0) {
            //     ctx.fillStyle = 'red';
            //     shape.vertices.forEach(v => ctx.fillRect(v.x - 2, v.y - 2, 4, 4));
            // }
        });

        // Sürüklenen şekli çiz (varsa)
        if (draggedShape) {
            calculateVertices(draggedShape); // Sürüklenen şekil için köşeleri hesapla
             if (draggedShape.type === 'square') {
                drawSquare(ctx, draggedShape.x, draggedShape.y, draggedShape.size, draggedShape.color, draggedShape.rotation);
            } else if (draggedShape.type === 'rectangle') {
                drawRectangle(ctx, draggedShape.x, draggedShape.y, draggedShape.width, draggedShape.height, draggedShape.color, draggedShape.rotation);
            } else if (draggedShape.type === 'equilateralTriangle') {
                drawEquilateralTriangle(ctx, draggedShape.x, draggedShape.y, draggedShape.side, draggedShape.color, draggedShape.rotation);
            } else if (draggedShape.type === 'isoscelesRightTriangle') {
                drawIsoscelesRightTriangle(ctx, draggedShape.x, draggedShape.y, draggedShape.leg, draggedShape.color, draggedShape.rotation);
            } else if (draggedShape.type === 'pentagon') {
                drawPentagon(ctx, draggedShape.x, draggedShape.y, draggedShape.side, draggedShape.color, draggedShape.rotation);
            } else if (draggedShape.type === 'hexagon') {
                drawHexagon(ctx, draggedShape.x, draggedShape.y, draggedShape.side, draggedShape.color, draggedShape.rotation);
            }
            // Diğer şekilleri ekle

            // İsteğe bağlı: Hata ayıklama için köşeleri çiz
            // if (draggedShape.vertices && draggedShape.vertices.length > 0) {
            //     ctx.fillStyle = 'blue';
            //     draggedShape.vertices.forEach(v => ctx.fillRect(v.x - 2, v.y - 2, 4, 4));
            // }
        }
    }

    // --- Level Initialization ---
    function loadLevel(levelIndex) {
        if (levelIndex >= levels.length) {
            instructionsDisplay.textContent = "Tebrikler! Tüm seviyeleri tamamladınız!";
            checkSolutionBtn.disabled = true;
            resetLevelBtn.disabled = true;
            nextLevelBtn.style.display = 'none';
            shapePaletteContainer.innerHTML = ''; // Paleti temizle
            gameCanvas.style.display = 'none'; // Kanvası gizle
            return;
        }

        currentLevelIndex = levelIndex;
        const level = levels[currentLevelIndex];
        placedShapes = [];
        draggedShape = null;
        
        // Mevcut seviyedeki her farklı şekil tipinden bir tane alalım
        const shapeTypeMap = new Map();
        availableShapeTypes = [];
        
        level.shapeSequence.forEach(shape => {
            // Sadece tip değil, şeklin benzersiz özelliklerini içeren bir anahtar oluştur
            let shapeKey;
            
            if (shape.type === 'isoscelesRightTriangle') {
                shapeKey = `${shape.type}_${shape.leg}`; // Kenar uzunluğuna göre farklı anahtar
            } else if (shape.type === 'square') {
                shapeKey = `${shape.type}_${shape.size}`;
            } else if (shape.type === 'rectangle') {
                shapeKey = `${shape.type}_${shape.width}_${shape.height}`;
            } else if (shape.type === 'equilateralTriangle' || shape.type === 'pentagon' || 
                       shape.type === 'hexagon' || shape.type === 'rhombus') {
                shapeKey = `${shape.type}_${shape.side}`;
            } else {
                shapeKey = shape.type; // Yedek plan
            }
            
            if (!shapeTypeMap.has(shapeKey)) {
                // Bu tip şekilden henüz eklenmemişse, ekleyelim
                shapeTypeMap.set(shapeKey, JSON.parse(JSON.stringify(shape)));
                availableShapeTypes.push(JSON.parse(JSON.stringify(shape)));
            }
        });
        
        selectedShapeIndex = 0;

        levelDisplay.textContent = `Seviye: ${level.levelNumber}`;
        instructionsDisplay.textContent = level.message;
        
        gameCanvas.style.display = 'block'; // Kanvası göster
        drawTargetArea(level.targetArea);
        drawShapeInPalette(); // Seçili şekli kullanacak
        redrawCanvas();

        checkSolutionBtn.disabled = false;
        resetLevelBtn.disabled = false;
        nextLevelBtn.style.display = 'none';
        undoBtn.disabled = placedShapes.length === 0;
    }

    // --- Event Listeners ---
    gameCanvas.addEventListener('mousedown', (e) => {
        const rect = gameCanvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Önce var olan yerleştirilmiş bir şekle tıklanıp tıklanmadığını kontrol et
        for (let i = placedShapes.length - 1; i >= 0; i--) {
            const shape = placedShapes[i];
            
            // Farenin bu şeklin içinde olup olmadığını kontrol et
            if (isPointInShape(mouseX, mouseY, shape)) {
                // Sürüklemek için şekli placedShapes'den kaldır
                draggedShape = JSON.parse(JSON.stringify(shape));
                draggedShapeIndex = i;
                
                // Sürükleme ofsetini hesapla
                if (shape.type === 'square') {
                    dragOffsetX = mouseX - shape.x;
                    dragOffsetY = mouseY - shape.y;
                } else if (shape.type === 'rectangle') {
                    dragOffsetX = mouseX - shape.x;
                    dragOffsetY = mouseY - shape.y;
                } else if (shape.type === 'equilateralTriangle') {
                    dragOffsetX = mouseX - shape.x;
                    dragOffsetY = mouseY - shape.y;
                } else if (shape.type === 'isoscelesRightTriangle') {
                    dragOffsetX = mouseX - shape.x;
                    dragOffsetY = mouseY - shape.y;
                } else {
                    // Diğer şekiller için varsayılan
                    dragOffsetX = mouseX - shape.x;
                    dragOffsetY = mouseY - shape.y;
                }
                
                // Geçici olarak şekli placedShapes'den kaldır
                placedShapes.splice(i, 1);
                redrawCanvas();
                return;
            }
        }
    });

    shapePaletteCanvas.addEventListener('mousedown', (e) => {
        // Palet şekli sürükleme için mevcut kod
        const level = levels[currentLevelIndex];
        if (!level || !availableShapeTypes || availableShapeTypes.length === 0) {
            return; // Sürüklenecek şekil yok
        }

        const shapeToDrag = availableShapeTypes[selectedShapeIndex];
        draggedShape = JSON.parse(JSON.stringify(shapeToDrag)); // Tam kopya
        draggedShapeIndex = -1; // Bu, placedShapes'den değil yeni bir şekil olduğunu belirtir
        
        const paletteRect = shapePaletteCanvas.getBoundingClientRect();
        const gameCanvasRect = gameCanvas.getBoundingClientRect();

        // Determine the visual top-left of the shape in the palette for offset calculation
        let paletteShapeDrawX, paletteShapeDrawY;
        let shapeLogicalWidth, shapeLogicalHeight;

        if (draggedShape.type === 'square') {
            shapeLogicalWidth = draggedShape.size;
            shapeLogicalHeight = draggedShape.size;
            paletteShapeDrawX = (shapePaletteCanvas.width - shapeLogicalWidth) / 2;
            paletteShapeDrawY = (shapePaletteCanvas.height - shapeLogicalHeight) / 2;
        } else if (draggedShape.type === 'rectangle') {
            shapeLogicalWidth = draggedShape.width;
            shapeLogicalHeight = draggedShape.height;
            paletteShapeDrawX = (shapePaletteCanvas.width - shapeLogicalWidth) / 2;
            paletteShapeDrawY = (shapePaletteCanvas.height - shapeLogicalHeight) / 2;
        } else if (draggedShape.type === 'equilateralTriangle') {
            shapeLogicalWidth = draggedShape.side;
            shapeLogicalHeight = (Math.sqrt(3) / 2) * draggedShape.side;
            paletteShapeDrawX = (shapePaletteCanvas.width - shapeLogicalWidth) / 2;
            paletteShapeDrawY = (shapePaletteCanvas.height - shapeLogicalHeight) / 2;
        } else if (draggedShape.type === 'isoscelesRightTriangle') {
            shapeLogicalWidth = draggedShape.leg;
            shapeLogicalHeight = draggedShape.leg;
            
            // Büyük üçgenler için ek ölçekleme
            let scale = 1.0;
            if (draggedShape.leg > 100) {
                // Palette içine sığacak şekilde ölçekle
                scale = 150 / draggedShape.leg;
                // Sürükleme sırasında orijinal boyutu koru, sadece paletdeki görünümü ölçekle
            }
            
            paletteShapeDrawX = (shapePaletteCanvas.width - shapeLogicalWidth * scale) / 2;
            paletteShapeDrawY = (shapePaletteCanvas.height - shapeLogicalHeight * scale) / 2;
        } else if (draggedShape.type === 'pentagon') {
            const R_p = draggedShape.side / (2 * Math.sin(Math.PI / 5));
            shapeLogicalWidth = 2 * R_p * Math.sin(2 * Math.PI / 5);
            shapeLogicalHeight = R_p * (1 + Math.cos(Math.PI / 5));
            paletteShapeDrawX = (shapePaletteCanvas.width - shapeLogicalWidth) / 2;
            paletteShapeDrawY = (shapePaletteCanvas.height - shapeLogicalHeight) / 2;
        } else if (draggedShape.type === 'hexagon') {
            shapeLogicalWidth = 2 * draggedShape.side;
            shapeLogicalHeight = Math.sqrt(3) * draggedShape.side;
            paletteShapeDrawX = (shapePaletteCanvas.width - shapeLogicalWidth) / 2;
            paletteShapeDrawY = (shapePaletteCanvas.height - shapeLogicalHeight) / 2;
        } else { // Fallback
            shapeLogicalWidth = 50; 
            shapeLogicalHeight = 50;
            paletteShapeDrawX = (shapePaletteCanvas.width - shapeLogicalWidth) / 2;
            paletteShapeDrawY = (shapePaletteCanvas.height - shapeLogicalHeight) / 2;
        }

        // Offset from the shape's visual top-left corner in the palette to the click point
        dragOffsetX = (e.clientX - paletteRect.left) - paletteShapeDrawX;
        dragOffsetY = (e.clientY - paletteRect.top) - paletteShapeDrawY;

        // İkizkenar dik üçgenler için sürükleme düzeltmesi
        if (draggedShape.type === 'isoscelesRightTriangle') {
            // Üçgenin merkez noktasından sürükleme
            dragOffsetX = draggedShape.leg / 2;
            dragOffsetY = draggedShape.leg / 2;
        }

        // Initial position on game canvas: mouse position on canvas minus the calculated offset
        draggedShape.x = (e.clientX - gameCanvasRect.left) - dragOffsetX;
        draggedShape.y = (e.clientY - gameCanvasRect.top) - dragOffsetY;
        
        redrawCanvas(); 
    });

    gameCanvas.addEventListener('mousemove', (e) => {
        if (!draggedShape) return;

        const gameCanvasRect = gameCanvas.getBoundingClientRect();
        // Update shape's top-left based on mouse position and the initial drag offset
        draggedShape.x = (e.clientX - gameCanvasRect.left) - dragOffsetX;
        draggedShape.y = (e.clientY - gameCanvasRect.top) - dragOffsetY;
        
        redrawCanvas();
    });

    gameCanvas.addEventListener('mouseup', (e) => {
        if (!draggedShape) return;

        const level = levels[currentLevelIndex];
        const targetArea = level.targetArea;

        // Snap the shape's top-left (x,y) to the grid, relative to the target area's origin
        // The shape's x,y is its top-left corner if unrotated.
        draggedShape.x = TARGET_AREA_OFFSET_X + Math.round((draggedShape.x - TARGET_AREA_OFFSET_X) / SNAP_GRID_SIZE) * SNAP_GRID_SIZE;
        draggedShape.y = TARGET_AREA_OFFSET_Y + Math.round((draggedShape.y - TARGET_AREA_OFFSET_Y) / SNAP_GRID_SIZE) * SNAP_GRID_SIZE;
        
        calculateVertices(draggedShape); // Recalculate vertices after snapping position

        let allVerticesInBounds = true;
        if (draggedShape.vertices && draggedShape.vertices.length > 0) {
            for (const vertex of draggedShape.vertices) {
                if (vertex.x < TARGET_AREA_OFFSET_X - 0.1 || // Add small tolerance for floating point
                    vertex.x > TARGET_AREA_OFFSET_X + targetArea.width + 0.1 ||
                    vertex.y < TARGET_AREA_OFFSET_Y - 0.1 ||
                    vertex.y > TARGET_AREA_OFFSET_Y + targetArea.height + 0.1) {
                    allVerticesInBounds = false;
                    break;
                }
            }
        } else {
            allVerticesInBounds = false; // Should not happen if calculateVertices is correct
        }

        // Şekil sınırların dışındaysa, sınırlar içine çekelim
        if (!allVerticesInBounds) {
            // Köşelerin ne kadar dışarıda olduğunu kontrol et
            let minXOverflow = 0, maxXOverflow = 0, minYOverflow = 0, maxYOverflow = 0;
            
            for (const vertex of draggedShape.vertices) {
                if (vertex.x < TARGET_AREA_OFFSET_X) {
                    minXOverflow = Math.min(minXOverflow, vertex.x - TARGET_AREA_OFFSET_X);
                }
                if (vertex.x > TARGET_AREA_OFFSET_X + targetArea.width) {
                    maxXOverflow = Math.max(maxXOverflow, vertex.x - (TARGET_AREA_OFFSET_X + targetArea.width));
                }
                if (vertex.y < TARGET_AREA_OFFSET_Y) {
                    minYOverflow = Math.min(minYOverflow, vertex.y - TARGET_AREA_OFFSET_Y);
                }
                if (vertex.y > TARGET_AREA_OFFSET_Y + targetArea.height) {
                    maxYOverflow = Math.max(maxYOverflow, vertex.y - (TARGET_AREA_OFFSET_Y + targetArea.height));
                }
            }
            
            // X ve Y konumlarını ayarla
            if (minXOverflow < 0) {
                draggedShape.x -= minXOverflow;
            }
            if (maxXOverflow > 0) {
                draggedShape.x -= maxXOverflow;
            }
            if (minYOverflow < 0) {
                draggedShape.y -= minYOverflow;
            }
            if (maxYOverflow > 0) {
                draggedShape.y -= maxYOverflow;
            }
            
            // Köşeleri yeni konuma göre tekrar hesapla
            calculateVertices(draggedShape);
            
            // Sınırlar içine çektikten sonra tekrar kontrol et
            allVerticesInBounds = true;
            for (const vertex of draggedShape.vertices) {
                if (vertex.x < TARGET_AREA_OFFSET_X - 0.1 || 
                    vertex.x > TARGET_AREA_OFFSET_X + targetArea.width + 0.1 ||
                    vertex.y < TARGET_AREA_OFFSET_Y - 0.1 || 
                    vertex.y > TARGET_AREA_OFFSET_Y + targetArea.height + 0.1) {
                    allVerticesInBounds = false;
                    break;
                }
            }
        }

        // Eğer hala sınırların dışındaysa, temel bir kontrol daha yapalım
        if (!allVerticesInBounds) {
            // Şeklin konumunu hedef alanın merkezine yakın bir noktaya taşı
            draggedShape.x = TARGET_AREA_OFFSET_X + targetArea.width / 2 - 25;
            draggedShape.y = TARGET_AREA_OFFSET_Y + targetArea.height / 2 - 25;
            calculateVertices(draggedShape);
            allVerticesInBounds = true; // Artık sınırlar içinde kabul ediyoruz
        }

        if (allVerticesInBounds) {
            // Check if the shape would overlap with existing shapes
            let hasOverlap = false;
            
            // First, try to place at the current position
            for (const placedShape of placedShapes) {
                if (checkShapesOverlap(draggedShape, placedShape)) {
                    hasOverlap = true;
                    break;
                }
            }
            
            // If there's overlap, try nearby positions
            if (hasOverlap) {
                const originalX = draggedShape.x;
                const originalY = draggedShape.y;
                const directions = [
                    { dx: SNAP_GRID_SIZE, dy: 0 },       // right
                    { dx: 0, dy: SNAP_GRID_SIZE },       // down
                    { dx: -SNAP_GRID_SIZE, dy: 0 },      // left
                    { dx: 0, dy: -SNAP_GRID_SIZE },      // up
                    { dx: SNAP_GRID_SIZE, dy: SNAP_GRID_SIZE },    // right-down
                    { dx: -SNAP_GRID_SIZE, dy: SNAP_GRID_SIZE },   // left-down
                    { dx: -SNAP_GRID_SIZE, dy: -SNAP_GRID_SIZE },  // left-up
                    { dx: SNAP_GRID_SIZE, dy: -SNAP_GRID_SIZE }    // right-up
                ];
                
                // Try alternatives within a reasonable range (3 grid cells)
                const MAX_ATTEMPTS = 3;
                let foundValidPosition = false;
                
                for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
                    for (const dir of directions) {
                        draggedShape.x = originalX + dir.dx * attempt;
                        draggedShape.y = originalY + dir.dy * attempt;
                        
                        // Recalculate vertices for this position
                        calculateVertices(draggedShape);
                        
                        // First check boundaries
                        let stillInBounds = true;
                        for (const vertex of draggedShape.vertices) {
                            if (vertex.x < TARGET_AREA_OFFSET_X - 0.1 || 
                                vertex.x > TARGET_AREA_OFFSET_X + targetArea.width + 0.1 ||
                                vertex.y < TARGET_AREA_OFFSET_Y - 0.1 || 
                                vertex.y > TARGET_AREA_OFFSET_Y + targetArea.height + 0.1) {
                                stillInBounds = false;
                                break;
                            }
                        }
                        
                        if (!stillInBounds) continue;
                        
                        // Check overlap with existing shapes
                        let currentOverlap = false;
                        for (const placedShape of placedShapes) {
                            if (checkShapesOverlap(draggedShape, placedShape)) {
                                currentOverlap = true;
                                break;
                            }
                        }
                        
                        if (!currentOverlap) {
                            foundValidPosition = true;
                            hasOverlap = false;
                            break;
                        }
                    }
                    
                    if (foundValidPosition) break;
                }
                
                // If we still couldn't find a position, revert to original position
                if (hasOverlap) {
                    draggedShape.x = originalX;
                    draggedShape.y = originalY;
                    calculateVertices(draggedShape);
                }
            }
            
            const newShape = JSON.parse(JSON.stringify(draggedShape));
            placedShapes.push(newShape);
            
            // Temel "mükemmel yerleştirme" kontrolü: Tam olarak hedef alanın kenarına veya
            // başka bir şekle çok yakın ama çakışmadan yerleştirilirse (SAT ile zaten ele alındı).
            // Bu, gösterim amaçlı basitleştirilmiş bir kontroldür.
            let isPerfectlyPlaced = false;
            if (newShape.vertices && newShape.vertices.length > 0) {
                const target = level.targetArea;
                // Hedef alan sınırlarına karşı kontrol et
                for(const v of newShape.vertices){
                    if(Math.abs(v.x - TARGET_AREA_OFFSET_X) < SNAP_GRID_SIZE/2 ||
                       Math.abs(v.x - (TARGET_AREA_OFFSET_X + target.width)) < SNAP_GRID_SIZE/2 ||
                       Math.abs(v.y - TARGET_AREA_OFFSET_Y) < SNAP_GRID_SIZE/2 ||
                       Math.abs(v.y - (TARGET_AREA_OFFSET_Y + target.height)) < SNAP_GRID_SIZE/2 ){
                        isPerfectlyPlaced = true;
                        break;
                       }
                }
                // Burada yakınlık için diğer yerleştirilmiş şekillere karşı da kontrol edilebilir
            }

            if (isPerfectlyPlaced) {
                if (highlightTimeoutId) clearTimeout(highlightTimeoutId);
                highlightedShapeIndex = placedShapes.length - 1;
                redrawCanvas(); // Vurgu ile bir kez yeniden çiz
                highlightTimeoutId = setTimeout(() => {
                    highlightedShapeIndex = -1;
                    redrawCanvas(); // Vurguyu kaldırmak için tekrar çiz
                }, 300); // 300ms boyunca vurgula
            }
        }
        
        draggedShape = null;
        draggedShapeIndex = -1;
        redrawCanvas(); // Final redraw after potential highlight timeout or if not placed
        undoBtn.disabled = placedShapes.length === 0;
    });
    
    // Döndürme tuşu olayı (daha net kullanıcı geribildirimi)
    window.addEventListener('keydown', (e) => {
        // Renk değişimini önlemek için flag kontrolü ekleyelim
        // Eğer zaten bir renk değişimi süreci varsa (tuşa basılı tutuluyorsa), 
        // yeni bir renk değişimi başlatmayacağız
        const isRotationKeyPressed = e.key === 'r' || e.key === 'R' || e.key === 'f' || e.key === 'F';
        
        // R tuşu işleme
        if (e.key === 'r' || e.key === 'R') {
            if (draggedShape) {
                // Normal rotasyon (15 derece)
                draggedShape.rotation = (draggedShape.rotation + ROTATION_STEP) % 360;
                
                // Değişen sadece rotasyon, renk değişimini kaldırdık
                redrawCanvas();
            } else if (highlightedShapeIndex >= 0 && highlightedShapeIndex < placedShapes.length) {
                // Vurgulanmış şekli döndür
                placedShapes[highlightedShapeIndex].rotation = 
                    (placedShapes[highlightedShapeIndex].rotation + ROTATION_STEP) % 360;
                
                // Şeklin köşe noktalarını güncelle
                calculateVertices(placedShapes[highlightedShapeIndex]);
                redrawCanvas();
            }
        } else if (e.key === 'f' || e.key === 'F') {
            if (draggedShape) {
                // Hassas rotasyon (5 derece)
                draggedShape.rotation = (draggedShape.rotation + FINE_ROTATION_STEP) % 360;
                
                // Değişen sadece rotasyon, renk değişimini kaldırdık
                redrawCanvas();
            } else if (highlightedShapeIndex >= 0 && highlightedShapeIndex < placedShapes.length) {
                // Vurgulanmış şekli hassas döndür
                placedShapes[highlightedShapeIndex].rotation = 
                    (placedShapes[highlightedShapeIndex].rotation + FINE_ROTATION_STEP) % 360;
                
                // Şeklin köşe noktalarını güncelle
                calculateVertices(placedShapes[highlightedShapeIndex]);
                redrawCanvas();
            }
        }
    });

    gameCanvas.addEventListener('mouseleave', (e) => {
        // Fare sürükleme sırasında kanvastan çıkarsa, sürüklemeyi iptal et veya bırak
        if (draggedShape) {
            // Şimdilik, sadece sürüklemeyi iptal et
            draggedShape = null;
            redrawCanvas();
        }
    });

    resetLevelBtn.addEventListener('click', () => {
        loadLevel(currentLevelIndex);
    });

    undoBtn.addEventListener('click', () => {
        if (placedShapes.length > 0) {
            placedShapes.pop();
            if (currentShapeInSequenceIndex > 0) { // 0'ın altına düşmediğinden emin ol
                currentShapeInSequenceIndex--;
            }
            drawShapeInPalette();
            redrawCanvas();
            
            // Doğru çözüm nedeniyle devre dışı bırakılmışsa çözüm kontrol düğmesini yeniden etkinleştir
            // ve başarı mesajı gösteriyorsa talimatları sıfırla
            const level = levels[currentLevelIndex];
            if (instructionsDisplay.textContent.startsWith("Tebrikler!")) {
                 instructionsDisplay.textContent = level.message;
            }
            checkSolutionBtn.disabled = false; 
            nextLevelBtn.style.display = 'none';
        }
        undoBtn.disabled = placedShapes.length === 0;
    });

    // --- Collision Detection / Solution Checking (SAT - Separating Axis Theorem) ---

    function getAxes(vertices) {
        const axes = [];
        for (let i = 0; i < vertices.length; i++) {
            const p1 = vertices[i];
            const p2 = vertices[(i + 1) % vertices.length]; // Sonraki köşe, etrafında dolanır
            const edge = { x: p2.x - p1.x, y: p2.y - p1.y };
            // Dik eksen (normal)
            const normal = { x: -edge.y, y: edge.x };
            axes.push(normalizeVector(normal));
        }
        return axes;
    }

    function normalizeVector(vector) {
        const magnitude = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
        if (magnitude === 0) return { x: 0, y: 0 }; // Sıfıra bölmeyi önle
        return { x: vector.x / magnitude, y: vector.y / magnitude };
    }

    function projectShapeOntoAxis(vertices, axis) {
        let min = Infinity;
        let max = -Infinity;
        for (const vertex of vertices) {
            const projection = vertex.x * axis.x + vertex.y * axis.y; // Nokta çarpımı
            min = Math.min(min, projection);
            max = Math.max(max, projection);
        }
        return { min, max };
    }

    const EPSILON = 1.5; // Toleransı artır (eski değer: 1.0)

    function doProjectionsOverlap(projection1, projection2) {
        // Projection1'in projection2'nin solunda VEYA projection2'nin projection1'in solunda olup olmadığını kontrol et
        // bir tolerans ile.
        // Eğer (projection1.max, projection2.min + EPSILON'dan küçük veya eşitse) VEYA
        //    (projection2.max, projection1.min + EPSILON'dan küçük veya eşitse)
        // o zaman çakışmazlar (veya sadece tolerans içinde temas ederler).
        // Yani, bu koşulların HİÇBİRİ doğru değilse çakışırlar.
        
        // Orijinal mantık: return projection1.max > projection2.min && projection2.max > projection1.min;
        // Epsilon ile yeni mantık:
        // Çakışma vardır - eğer projection1'in max'ı projection2'nin min'inden büyükse (epsilon'dan daha fazla)
        // VE projection2'nin max'ı projection1'in min'inden büyükse (epsilon'dan daha fazla).
        return projection1.max - projection2.min > EPSILON && 
               projection2.max - projection1.min > EPSILON;
    }

    function checkShapesOverlap(shape1, shape2) {
        if (!shape1.vertices || !shape2.vertices || shape1.vertices.length < 3 || shape2.vertices.length < 3) {
            return false; // Köşeler tanımlanmamışsa veya çokgen değilse çakışmayı kontrol edemeyiz
        }
        
        // Üçgenler için özel durum (görüntüden anlaşıldığı kadarıyla üçgenler arası çarpışmalar sorun oluyor)
        if (shape1.type === 'equilateralTriangle' && shape2.type === 'equilateralTriangle') {
            // Üçgenler arası mesafe kontrolü - merkezleri arasındaki mesafe
            const dx = shape1.x - shape2.x;
            const dy = shape1.y - shape2.y;
            const centerDistance = Math.sqrt(dx * dx + dy * dy);
            
            // Üçgenler arasında minimum mesafe (üçgenin yüksekliği kullanılarak)
            const triHeight1 = (Math.sqrt(3) / 2) * shape1.side;
            const triHeight2 = (Math.sqrt(3) / 2) * shape2.side;
            const minDistance = Math.max(triHeight1, triHeight2) * 0.8; // Biraz tolerans ile
            
            // Eğer merkezler arasındaki mesafe belli bir değerin altındaysa, çakışma var kabul edelim
            if (centerDistance < minDistance) {
                return true; // Üçgenler çakışıyor
            }
            return false; // Üçgenler çakışmıyor
        }
        
        // Diğer şekiller için standart kontrolü kullan
        const axes1 = getAxes(shape1.vertices);
        const axes2 = getAxes(shape2.vertices);

        // İlk çokgenin eksenlerini test et
        for (const axis of axes1) {
            const projection1 = projectShapeOntoAxis(shape1.vertices, axis);
            const projection2 = projectShapeOntoAxis(shape2.vertices, axis);
            if (!doProjectionsOverlap(projection1, projection2)) {
                return false; // Ayırıcı eksen bulundu
            }
        }

        // İkinci çokgenin eksenlerini test et
        for (const axis of axes2) {
            const projection1 = projectShapeOntoAxis(shape1.vertices, axis);
            const projection2 = projectShapeOntoAxis(shape2.vertices, axis);
            if (!doProjectionsOverlap(projection1, projection2)) {
                return false; // Ayırıcı eksen bulundu
            }
        }
        return true; // Ayırıcı eksen bulunamadı, çokgenler çakışıyor
    }
    
    function getShapeArea(shape) {
        if (!shape.vertices || shape.vertices.length < 3) return 0;
        // Çokgen alanı için Shoelace formülünü kullan
        let area = 0;
        for (let i = 0; i < shape.vertices.length; i++) {
            const p1 = shape.vertices[i];
            const p2 = shape.vertices[(i + 1) % shape.vertices.length];
            area += (p1.x * p2.y - p2.x * p1.y);
        }
        return Math.abs(area / 2);
    }


    checkSolutionBtn.addEventListener('click', () => {
        const level = levels[currentLevelIndex];
        const target = level.targetArea;
        let isCorrect = true;
        let message = "";

        if (placedShapes.length === 0) {
            isCorrect = false;
            message = "Hiç şekil yerleştirmediniz!";
        } else {
            // 1. Yerleştirilen şekillerin üst üste binmediğini kontrol et
            for (let i = 0; i < placedShapes.length; i++) {
                for (let j = i + 1; j < placedShapes.length; j++) {
                    if (checkShapesOverlap(placedShapes[i], placedShapes[j])) {
                        isCorrect = false;
                        message = "Şekiller üst üste biniyor!";
                        break;
                    }
                }
                if (!isCorrect) break;
            }

            // 2. Tüm şekillerin sınırlar içinde olduğundan emin ol (bırakma sırasında zaten çoğunlukla kontrol edildi, ama yeniden doğrulamak iyi olur)
            if (isCorrect) {
                for (const shape of placedShapes) {
                    if (!shape.vertices || shape.vertices.length === 0) calculateVertices(shape); // Köşelerin hesaplandığından emin ol
                    for (const vertex of shape.vertices) {
                        if (vertex.x < TARGET_AREA_OFFSET_X - 0.5 || // Toleransı biraz arttırdık
                            vertex.x > TARGET_AREA_OFFSET_X + target.width + 0.5 ||
                            vertex.y < TARGET_AREA_OFFSET_Y - 0.5 ||
                            vertex.y > TARGET_AREA_OFFSET_Y + target.height + 0.5) {
                            isCorrect = false;
                            message = "Bir veya daha fazla şekil hedef alanın dışında!";
                            break;
                        }
                    }
                    if (!isCorrect) break;
                }
            }

            // 3. Basitleştirilmiş Alan Kontrolü (Yerleştirilen şekillerin toplam alanı hedef alana karşı)
            // Bu, boşluk olmadan tam kaplama için gerekli ama yeterli olmayan bir koşuldur.
            if (isCorrect) {
                const targetAreaActual = target.width * target.height;
                let totalPlacedArea = 0;
                placedShapes.forEach(shape => {
                    totalPlacedArea += getShapeArea(shape);
                });

                // Alan hesaplamasındaki geometrik kısıtlamalar için daha yüksek bir tolerans izin ver
                const areaCoveragePercent = (totalPlacedArea / targetAreaActual) * 100;
                const minRequiredCoverage = 85; // En az %85 kaplama yeterli olacak
                
                if (areaCoveragePercent < minRequiredCoverage) {
                    isCorrect = false;
                    message = `Alan yeterince kaplanmadı. Kaplanan alan: %${areaCoveragePercent.toFixed(1)}, Hedef: en az %${minRequiredCoverage}`;
                } else if (areaCoveragePercent > 100 + 1) { // %1'lik küçük bir üst sınır toleransı
                    isCorrect = false;
                    message = `Alan gerekenden fazla kaplandı. Kaplanan alan: %${areaCoveragePercent.toFixed(1)}, Maksimum: %101`;
                } else {
                    // Kaplama yüzdesine göre yıldız puanı belirle
                    let stars = 0;
                    if (areaCoveragePercent >= 95) {
                        stars = 3; // %95+ kaplama = 3 yıldız
                    } else if (areaCoveragePercent >= 90) {
                        stars = 2; // %90-95 kaplama = 2 yıldız
                    } else {
                        stars = 1; // %85-90 kaplama = 1 yıldız
                    }
                    message = `Kaplama başarılı: %${areaCoveragePercent.toFixed(1)} - ${stars} yıldız kazandınız!`;
                }
            }
            
            // 4. Örüntü kontrolü - aynı tipteki şekillerin dağılımını kontrol et
            if (isCorrect) {
                // Şekil tiplerini grupla
                const shapeTypeGroups = {};
                placedShapes.forEach(shape => {
                    if (!shapeTypeGroups[shape.type]) {
                        shapeTypeGroups[shape.type] = [];
                    }
                    shapeTypeGroups[shape.type].push(shape);
                });
                
                // Her bir şekil tipi için örüntü kontrolü
                let hasValidPattern = true;
                
                // 1. seviye için özel kontrol - üçgen kullanımı zorunlu
                if (currentLevelIndex === 0) {
                    // 1. seviyede kareler ve dikdörtgenler örüntülü yerleştirilmeli
                    // Üçgen kontrolünü kaldırdık, çünkü 1. seviyede üçgen yok
                    if (Object.keys(shapeTypeGroups).length < 2) {
                        hasValidPattern = false;
                        message = "Örüntü oluşturmak için farklı tipte şekiller kullanmalısınız!";
                    } else {
                        // Her tipten en az 2 şekil kullanılmış mı kontrol et
                        for (const type in shapeTypeGroups) {
                            if (shapeTypeGroups[type].length < 2) {
                                hasValidPattern = false;
                                message = `Örüntü oluşturmak için her tipten en az 2 şekil kullanmalısınız! (${type} şeklinden sadece 1 adet var)`;
                                break;
                            }
                        }
                    }
                }
                // Diğer seviyeler için genel kontrol
                else {
                    // En az 2 farklı şekil tipi kullanılmış mı kontrol et
                    if (Object.keys(shapeTypeGroups).length < 2) {
                        hasValidPattern = false;
                        message = "Örüntü oluşturmak için en az 2 farklı tipte şekil kullanmalısınız!";
                    }
                    
                    // Her tipten en az 2 şekil kullanılmış mı kontrol et
                    if (hasValidPattern) {
                        for (const type in shapeTypeGroups) {
                            if (shapeTypeGroups[type].length < 2) {
                                hasValidPattern = false;
                                message = `Örüntü oluşturmak için her tipten en az 2 şekil kullanmalısınız! (${type} şeklinden sadece 1 adet var)`;
                                break;
                            }
                        }
                    }
                }
                
                // Şekillerin düzenli dağılımını kontrol et
                // Basit bir örüntü kontrolü: aynı tipteki şekiller birbirine yakın olmamalı
                if (hasValidPattern) {
                    for (const type in shapeTypeGroups) {
                        const shapes = shapeTypeGroups[type];
                        if (shapes.length >= 3) {
                            // Şekillerin merkez konumlarını hesapla
                            const positions = shapes.map(shape => ({
                                x: shape.x + (shape.width || shape.size || shape.leg || shape.side) / 2,
                                y: shape.y + (shape.height || shape.size || shape.leg || (Math.sqrt(3) / 2) * shape.side) / 2
                            }));
                            
                            // Şekillerin dağılımını kontrol et
                            let isDistributed = true;
                            
                            // 6. seviye için özel bir istisna ekleyelim - bu seviyede düzenli desen oluşturma amacı var
                            if (currentLevelIndex === 5) { // 0-tabanlı indeks olduğu için seviye 6 = indeks 5
                                // Seviye 6 için dağılım kontrolünü atla - desenli yerleşime izin ver
                                continue;
                            }
                            
                            for (let i = 0; i < positions.length; i++) {
                                let closeSameTypeCount = 0;
                                for (let j = 0; j < positions.length; j++) {
                                    if (i !== j) {
                                        const dx = positions[i].x - positions[j].x;
                                        const dy = positions[i].y - positions[j].y;
                                        const distance = Math.sqrt(dx * dx + dy * dy);
                                        
                                        // Aynı tipteki şekiller çok yakınsa
                                        // Level 1 için daha küçük bir eşik değeri kullan
                                        const distanceThreshold = currentLevelIndex === 0 ? 30 : 60;
                                        if (distance < distanceThreshold) {
                                            closeSameTypeCount++;
                                        }
                                    }
                                }
                                
                                // Yakınlık toleransını arttıralım
                                if (closeSameTypeCount > 3) { // 2'den 3'e çıkardım
                                    isDistributed = false;
                                    break;
                                }
                            }
                            
                            if (!isDistributed) {
                                hasValidPattern = false;
                                message = `Aynı tipteki şekiller daha iyi dağıtılmalı! Örüntü için şekilleri daha dengeli yerleştirin.`;
                                break;
                            }
                        }
                    }
                }
                
                if (!hasValidPattern) {
                    isCorrect = false;
                }
            }
        }

        if (isCorrect) {
            instructionsDisplay.textContent = message || "Tebrikler! Doğru çözüm ve güzel bir örüntü!";
            nextLevelBtn.style.display = 'inline-block';
            checkSolutionBtn.disabled = true;
            
            // Yıldız gösterimini ekle
            const starsMatch = message.match(/(\d+) yıldız/);
            if (starsMatch && starsMatch[1]) {
                const stars = parseInt(starsMatch[1]);
                let starsHTML = '';
                for (let i = 0; i < stars; i++) {
                    starsHTML += '⭐';
                }
                instructionsDisplay.textContent += ` ${starsHTML}`;
            }
        } else {
            instructionsDisplay.textContent = message || "Tam olarak kaplanmadı veya hatalar var. Tekrar deneyin.";
        }
    });

    nextLevelBtn.addEventListener('click', () => {
        loadLevel(currentLevelIndex + 1);
    });
    
    // Seviye Seçme İşlevsellikleri
    // Dropdown menüyü oluşturan fonksiyon
    function createLevelDropdown() {
        levelDropdown.innerHTML = '';
        levels.forEach((level, index) => {
            const levelButton = document.createElement('button');
            levelButton.textContent = `Seviye ${level.levelNumber}`;
            levelButton.dataset.levelIndex = index;
            levelButton.addEventListener('click', () => {
                // Seviye değiştirildiğinde doğrulama yapılmasını isteyelim
                if (placedShapes.length > 0) {
                    if (!confirm("Yerleştirdiğiniz şekiller kaybolacak. Devam etmek istiyor musunuz?")) {
                        return;
                    }
                }
                loadLevel(index);
                toggleLevelDropdown();
            });
            levelDropdown.appendChild(levelButton);
        });
    }
    
    // Dropdown menüyü aç/kapat
    function toggleLevelDropdown() {
        levelDropdown.classList.toggle('show');
    }
    
    // Dropdown dışına tıklandığında menüyü kapat
    window.addEventListener('click', (event) => {
        if (!event.target.matches('#level-select-btn') && levelDropdown.classList.contains('show')) {
            levelDropdown.classList.remove('show');
        }
    });
    
    // Seviye seçme butonuna tıklandığında
    levelSelectBtn.addEventListener('click', () => {
        createLevelDropdown();
        toggleLevelDropdown();
    });

    // --- Initialize Game ---
    loadLevel(currentLevelIndex);

    // Eğlenceli renk paleti
    const eglenceliRenkler = [
        '#FF4B91', // Parlak pembe
        '#FF7676', // Kızıl pembe  
        '#FF9F4A', // Turuncu
        '#FFD166', // Hardal sarısı
        '#06D6A0', // Yosun yeşili
        '#1B9AAA', // Turkuaz
        '#6A4C93', // Mor
        '#7F4FFF', // Parlak mor
        '#41EAD4', // Parlak turkuaz
        '#FBFF12', // Parlak sarı
        '#9C19E0', // Mor
        '#FF5757', // Parlak kırmızı
        '#00DDEB', // Turkuaz
        '#FFBD59', // Amber
        '#00B2CA', // Mavi
        '#7765E3', // Lavanta
        '#FF8552', // Turuncu
        '#23CE6B', // Yeşil
        '#FFA69E', // Şeftali
        '#A846A0', // Mor
        '#00A9A5', // Yeşil turkuaz
        '#EA526F', // Kırmızı
        '#F7CB15', // Parlak sarı
        '#86BBD8'  // Açık mavi
    ];
});

// Yardımcı fonksiyon: Bir noktanın şeklin içinde olup olmadığını kontrol eder
function isPointInShape(x, y, shape) {
    if (!shape.vertices || shape.vertices.length === 0) {
        calculateVertices(shape); // Köşelerin hesaplandığından emin ol
    }
    
    // Basit şekiller için kolay kontrol
    if (shape.type === 'square') {
        return (x >= shape.x && x <= shape.x + shape.size &&
                y >= shape.y && y <= shape.y + shape.size);
    } else if (shape.type === 'rectangle') {
        return (x >= shape.x && x <= shape.x + shape.width &&
                y >= shape.y && y <= shape.y + shape.height);
    } 
    
    // Diğer şekiller için içinde bulunma kontrolü
    // Yatay ışın algoritması kullanılır
    const vertices = shape.vertices;
    let inside = false;
    
    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
        const xi = vertices[i].x, yi = vertices[i].y;
        const xj = vertices[j].x, yj = vertices[j].y;
        
        const intersect = ((yi > y) != (yj > y)) &&
            (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            
        if (intersect) inside = !inside;
    }
    
    return inside;
}
