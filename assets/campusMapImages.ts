// Metro (RN's bundler) needs static, literal require() paths — it can't
// resolve a dynamic `require(filename)`. So every campus image is required
// once here, and CampusMapScreen looks images up by filename through this map.
//
// Copy every file from the website's `frontend/public/campus_images/`
// folder into `assets/campus_images/` in this project (same filenames),
// then this file will resolve correctly.
export const campusMapImages: Record<string, any> = {
  "b block.webp": require('../assets/campus_images/b block.webp'),
  "c-block.webp": require('../assets/campus_images/c-block.webp'),
  "campus-map.webp": require('../assets/campus_images/campus-map.webp'),
  "cos.webp": require('../assets/campus_images/cos.webp'),
  "cricket.webp": require('../assets/campus_images/cricket.webp'),
  "cs-block-1.webp": require('../assets/campus_images/cs-block-1.webp'),
  "cs-block-2.webp": require('../assets/campus_images/cs-block-2.webp'),
  "d block.webp": require('../assets/campus_images/d block.webp'),
  "dean-visitors.webp": require('../assets/campus_images/dean-visitors.webp'),
  "directorate-1.webp": require('../assets/campus_images/directorate-1.webp'),
  "directorate-2.webp": require('../assets/campus_images/directorate-2.webp'),
  "e-block.webp": require('../assets/campus_images/e-block.webp'),
  "elc-building.webp": require('../assets/campus_images/elc-building.webp'),
  "f-block.webp": require('../assets/campus_images/f-block.webp'),
  "g-block.webp": require('../assets/campus_images/g-block.webp'),
  "h-block.webp": require('../assets/campus_images/h-block.webp'),
  "health-centre.webp": require('../assets/campus_images/health-centre.webp'),
  "hostel-a.webp": require('../assets/campus_images/hostel-a.webp'),
  "hostel-b.webp": require('../assets/campus_images/hostel-b.webp'),
  "hostel-c.webp": require('../assets/campus_images/hostel-c.webp'),
  "hostel-d.webp": require('../assets/campus_images/hostel-d.webp'),
  "hostel-g.webp": require('../assets/campus_images/hostel-g.webp'),
  "hostel-h.webp": require('../assets/campus_images/hostel-h.webp'),
  "hostel-i.webp": require('../assets/campus_images/hostel-i.webp'),
  "hostel-j.webp": require('../assets/campus_images/hostel-j.webp'),
  "hostel-k.webp": require('../assets/campus_images/hostel-k.webp'),
  "hostel-l.webp": require('../assets/campus_images/hostel-l.webp'),
  "hostel-m-1.webp": require('../assets/campus_images/hostel-m-1.webp'),
  "hostel-m-2.webp": require('../assets/campus_images/hostel-m-2.webp'),
  "hostel-n-1.webp": require('../assets/campus_images/hostel-n-1.webp'),
  "hostel-n-2.webp": require('../assets/campus_images/hostel-n-2.webp'),
  "hostel-o.webp": require('../assets/campus_images/hostel-o.webp'),
  "hostel-q.webp": require('../assets/campus_images/hostel-q.webp'),
  "kravings.webp": require('../assets/campus_images/kravings.webp'),
  "learning-theatre.webp": require('../assets/campus_images/learning-theatre.webp'),
  "library.webp": require('../assets/campus_images/library.webp'),
  "main-auditorium.webp": require('../assets/campus_images/main-auditorium.webp'),
  "mechanical-workshop.webp": require('../assets/campus_images/mechanical-workshop.webp'),
  "oat.webp": require('../assets/campus_images/oat.webp'),
  "sports.webp": require('../assets/campus_images/sports.webp'),
  "swimming.webp": require('../assets/campus_images/swimming.webp'),
  "synthetic-track.webp": require('../assets/campus_images/synthetic-track.webp'),
  "tan-building.webp": require('../assets/campus_images/tan-building.webp'),
  "tslas.webp": require('../assets/campus_images/tslas.webp'),
  "venture-lab.webp": require('../assets/campus_images/venture-lab.webp'),
};

// The full campus map background image.
export const campusMapBackground = require('../assets/campus_images/campus-map.webp');