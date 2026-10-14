/**
 * SCMS Cloud & Object Media Storage Service
 * Kỹ thuật Quản lý Lưu trữ Đa Phương Tiện Đám Mây (Cloud/Object Storage)
 * Hỗ trợ tải tệp ảnh từ máy, thư viện ảnh đám mây thể thao chất lượng cao, và CDN link.
 */

// Bộ sưu tập ảnh thể thao đám mây chuẩn Olympic (Curated High-Res Cloud Sport Assets)
export const CLOUD_SPORT_ASSETS = [
  {
    id: 'asset-pool-01',
    category: 'aquatics',
    categoryName: 'Bơi lội',
    title: 'Bể bơi tiêu chuẩn 5 làn nước ấm',
    url: 'https://images.unsplash.com/photo-1519315901367-f34ff9154487?q=80&w=1200&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1519315901367-f34ff9154487?q=80&w=300&auto=format&fit=crop'
  },
  {
    id: 'asset-pool-02',
    category: 'aquatics',
    categoryName: 'Bơi lội',
    title: 'Học viên luyện bơi bướm chuyên nghiệp',
    url: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?q=80&w=1200&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?q=80&w=300&auto=format&fit=crop'
  },
  {
    id: 'asset-gym-01',
    category: 'fitness-wellness',
    categoryName: 'Gym & Fitness',
    title: 'Dàn máy tạ kháng lực Matrix & InBody',
    url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1200&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=300&auto=format&fit=crop'
  },
  {
    id: 'asset-gym-02',
    category: 'fitness-wellness',
    categoryName: 'Gym & Fitness',
    title: 'Tập luyện thể hình tăng cơ giảm mỡ',
    url: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1200&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=300&auto=format&fit=crop'
  },
  {
    id: 'asset-yoga-01',
    category: 'fitness-wellness',
    categoryName: 'Yoga & Pilates',
    title: 'Lớp Yoga thiền định & sàn gỗ tự nhiên',
    url: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?q=80&w=1200&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?q=80&w=300&auto=format&fit=crop'
  },
  {
    id: 'asset-yoga-02',
    category: 'fitness-wellness',
    categoryName: 'Yoga & Pilates',
    title: 'Máy tập Pilates Reformer chuyên sâu',
    url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=1200&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=300&auto=format&fit=crop'
  },
  {
    id: 'asset-football-01',
    category: 'team-sports',
    categoryName: 'Bóng đá',
    title: 'Sân cỏ nhân tạo 7 người tiêu chuẩn',
    url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1200&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=300&auto=format&fit=crop'
  },
  {
    id: 'asset-football-02',
    category: 'team-sports',
    categoryName: 'Bóng đá',
    title: 'Bóng thi đấu và giày đinh cỏ nhân tạo',
    url: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?q=80&w=1200&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?q=80&w=300&auto=format&fit=crop'
  },
  {
    id: 'asset-badminton-01',
    category: 'team-sports',
    categoryName: 'Cầu lông',
    title: 'Vận động viên bật nhảy đập cầu thảm PVC',
    url: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=1200&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=300&auto=format&fit=crop'
  },
  {
    id: 'asset-badminton-02',
    category: 'team-sports',
    categoryName: 'Cầu lông',
    title: 'Vợt cầu lông và quả cầu tốc độ chuẩn',
    url: 'https://images.unsplash.com/photo-1613918108466-292b78a8ef95?q=80&w=1200&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1613918108466-292b78a8ef95?q=80&w=300&auto=format&fit=crop'
  },
  {
    id: 'asset-basketball-01',
    category: 'team-sports',
    categoryName: 'Bóng rổ',
    title: 'Trụ rổ bảng kính cường lực & sân acrylic',
    url: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?q=80&w=1200&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?q=80&w=300&auto=format&fit=crop'
  },
  {
    id: 'asset-basketball-02',
    category: 'team-sports',
    categoryName: 'Bóng rổ',
    title: 'Trái bóng rổ trên sàn đấu trong nhà',
    url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=1200&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=300&auto=format&fit=crop'
  },
  {
    id: 'asset-tabletennis-01',
    category: 'team-sports',
    categoryName: 'Bóng bàn',
    title: 'Bàn bóng bàn thi đấu phòng điều hòa',
    url: 'https://images.unsplash.com/photo-1708268411988-d30e0e1eef0c?q=80&w=1200&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1708268411988-d30e0e1eef0c?q=80&w=300&auto=format&fit=crop'
  },
  {
    id: 'asset-pickleball-01',
    category: 'team-sports',
    categoryName: 'Pickleball',
    title: 'Cụm sân Pickleball ngoài trời mặt sơn chuẩn',
    url: 'https://images.unsplash.com/photo-1693142517898-2f986215e412?q=80&w=1200&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1693142517898-2f986215e412?q=80&w=300&auto=format&fit=crop'
  },
  {
    id: 'asset-boxing-01',
    category: 'combat',
    categoryName: 'Võ thuật & Boxing',
    title: 'Sàn đấu Boxing & dàn bao cát kiên cố',
    url: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?q=80&w=1200&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?q=80&w=300&auto=format&fit=crop'
  },
  {
    id: 'asset-boxing-02',
    category: 'combat',
    categoryName: 'Võ thuật & Boxing',
    title: 'Găng tay đấm bốc thi đấu chuyên nghiệp',
    url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1200&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=300&auto=format&fit=crop'
  }
];

/**
 * Xử lý tải ảnh từ File máy tính sang Object Data URL / Cloud Storage
 * Tự động nén kích thước để đảm bảo tải nhanh và hiển thị mượt mà.
 */
export async function uploadMediaFileToCloud(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('Chưa chọn tệp'));
      return;
    }

    if (!file.type.startsWith('image/')) {
      reject(new Error('Vui lòng chọn tệp hình ảnh (JPEG, PNG, WEBP, v.v.)'));
      return;
    }

    // Giới hạn 10MB
    if (file.size > 10 * 1024 * 1024) {
      reject(new Error('Kích thước ảnh tối đa là 10MB'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Tối ưu hóa kích thước tối đa 1600px để giữ nét mà không nặng
        const maxWidth = 1600;
        const maxHeight = 1200;
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Xuất chuẩn WEBP / JPEG
        const optimizedDataUrl = canvas.toDataURL('image/webp', 0.88);

        resolve({
          url: optimizedDataUrl,
          name: file.name,
          size: Math.round((optimizedDataUrl.length * 3) / 4),
          dimensions: `${width}x${height}`,
          type: 'image/webp',
          uploadedAt: new Date().toISOString()
        });
      };
      img.onerror = () => reject(new Error('Không thể xử lý hình ảnh'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Không thể đọc tệp'));
    reader.readAsDataURL(file);
  });
}
