// COCO 80 class labels used by YOLOv8
export const YOLO_LABELS: string[] = [
  "person", "bicycle", "car", "motorcycle", "airplane", "bus", "train", "truck", "boat",
  "traffic light", "fire hydrant", "stop sign", "parking meter", "bench", "bird", "cat",
  "dog", "horse", "sheep", "cow", "elephant", "bear", "zebra", "giraffe", "backpack",
  "umbrella", "handbag", "tie", "suitcase", "frisbee", "skis", "snowboard", "sports ball",
  "kite", "baseball bat", "baseball glove", "skateboard", "surfboard", "tennis racket",
  "bottle", "wine glass", "cup", "fork", "knife", "spoon", "bowl", "banana", "apple",
  "sandwich", "orange", "broccoli", "carrot", "hot dog", "pizza", "donut", "cake",
  "chair", "couch", "potted plant", "bed", "dining table", "toilet", "tv", "laptop",
  "mouse", "remote", "keyboard", "cell phone", "microwave", "oven", "toaster", "sink",
  "refrigerator", "book", "clock", "vase", "scissors", "teddy bear", "hair drier", "toothbrush",
];

// Food-related COCO labels (indices)
export const FOOD_LABEL_INDICES = new Set([
  39, // bottle
  40, // wine glass
  41, // cup
  42, // fork
  43, // knife
  44, // spoon
  45, // bowl
  46, // banana
  47, // apple
  48, // sandwich
  49, // orange
  50, // broccoli
  51, // carrot
  52, // hot dog
  53, // pizza
  54, // donut
  55, // cake
  60, // dining table
  68, // microwave
  69, // oven
  70, // toaster
  71, // sink
  72, // refrigerator
]);

// Map YOLO labels to Indian kitchen ingredient names
export const YOLO_TO_INGREDIENT: Record<string, string> = {
  apple: "Apple",
  orange: "Orange",
  banana: "Banana",
  broccoli: "Broccoli",
  carrot: "Carrot",
  sandwich: "Bread",
  pizza: "Pizza Base",
  cake: "Cake",
  donut: "Donut",
  "hot dog": "Sausage",
  bottle: "Milk/Water",
  cup: "Chai/Coffee",
  bowl: "Dal/Curry",
  "wine glass": "Lassi Glass",
  fork: "Fork",
  knife: "Knife",
  spoon: "Spoon",
};
