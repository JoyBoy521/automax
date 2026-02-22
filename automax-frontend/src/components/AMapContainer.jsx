import React, { useEffect, useRef } from 'react';
import AMapLoader from '@amap/amap-jsapi-loader';

export default function AMapContainer({ storeData, address, city }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  useEffect(() => {
    const safeStoreData = storeData || {};
    const longitude = Number.parseFloat(safeStoreData.longitude ?? safeStoreData.lng);
    const latitude = Number.parseFloat(safeStoreData.latitude ?? safeStoreData.lat);
    const detailAddress = safeStoreData.detailAddress || address || city || 'AutoMax 门店';

    // 坐标缺失时不初始化地图，避免页面崩溃
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude) || !mapRef.current) return;

    AMapLoader.load({
      key: "38334760782f6e9b5f7fca11f6d061d2", 
      version: "2.0",
      plugins: ['AMap.Marker'] // 只展示位置的话，甚至不需要 Geocoder 插件
    }).then((AMap) => {
      // 如果已存在实例则销毁，防止重复初始化
      if (mapInstance.current) mapInstance.current.destroy();

      const map = new AMap.Map(mapRef.current, {
        zoom: 16,
        center: [longitude, latitude], // 🌟 直接定位到门店坐标
        viewMode: '3D'
      });

      // 添加门店标记点
      const marker = new AMap.Marker({
        position: [longitude, latitude],
        title: detailAddress,
        animation: 'AMAP_ANIMATION_DROP'
      });
      map.add(marker);

      mapInstance.current = map;
    }).catch(e => console.error("地图加载失败:", e));

    return () => {
      if (mapInstance.current) {
        mapInstance.current.destroy();
        mapInstance.current = null;
      }
    };
  }, [storeData, address, city]);

  return <div ref={mapRef} className="w-full h-full min-h-[200px] rounded-2xl" />;
}
