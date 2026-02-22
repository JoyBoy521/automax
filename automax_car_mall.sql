/*
 Navicat Premium Dump SQL

 Source Server         : 2
 Source Server Type    : MySQL
 Source Server Version : 50744 (5.7.44-log)
 Source Host           : localhost:3306
 Source Schema         : automax_car_mall

 Target Server Type    : MySQL
 Target Server Version : 50744 (5.7.44-log)
 File Encoding         : 65001

 Date: 22/02/2026 22:40:07
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for car_lead
-- ----------------------------
DROP TABLE IF EXISTS `car_lead`;
CREATE TABLE `car_lead`  (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '客户手机号',
  `city` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '所在城市',
  `intention_model` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '意向车型(手填)',
  `mileage` decimal(10, 2) NULL DEFAULT NULL COMMENT '表显里程',
  `expected_price` decimal(10, 2) NULL DEFAULT NULL COMMENT '期望售价(万)',
  `store_id` bigint(20) NULL DEFAULT NULL COMMENT '系统就近分配的跟进门店',
  `status` tinyint(4) NULL DEFAULT 0 COMMENT '0-待跟进, 1-已联系预约, 2-已到店评估, 3-已战败, 4-成功收购并入库',
  `create_time` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = 'C2B收车评估线索表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of car_lead
-- ----------------------------
INSERT INTO `car_lead` VALUES (1, '15302287385', '13', '1313', 13.00, 13.00, NULL, 2, '2026-02-22 17:29:46');
INSERT INTO `car_lead` VALUES (2, '13121132132', '13', '13', 13.00, 13.00, NULL, 1, '2026-02-22 18:35:24');

-- ----------------------------
-- Table structure for car_sku
-- ----------------------------
DROP TABLE IF EXISTS `car_sku`;
CREATE TABLE `car_sku`  (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `vin_code` varchar(17) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '车架号(VIN码)-唯一标识',
  `spu_id` bigint(20) NOT NULL COMMENT '关联车型SPU',
  `store_id` bigint(20) NOT NULL COMMENT '所属门店',
  `mileage` decimal(10, 2) NOT NULL COMMENT '表显里程(万公里)',
  `register_date` datetime NULL DEFAULT NULL,
  `show_price` decimal(10, 2) NOT NULL COMMENT '展示标价(万)',
  `cost_price` decimal(10, 2) NULL DEFAULT NULL,
  `status` tinyint(4) NULL DEFAULT 1 COMMENT '状态: 1-待整备, 2-在售, 3-已预定, 4-已售出',
  `images` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL COMMENT '车辆图片URL(JSON数组存储)',
  `condition_report` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL COMMENT '瑕疵披露与检测报告',
  `version` int(11) NULL DEFAULT 0 COMMENT '乐观锁版本号-防超卖关键',
  `create_time` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `first_reg_date` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '未知' COMMENT '首次上牌时间',
  `emission_std` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '国VI' COMMENT '排放标准',
  `car_score` int(11) NULL DEFAULT 100 COMMENT '车况智能评分',
  `major_risks` json NULL COMMENT '排除隐患(JSON数组)',
  `flaws` json NULL COMMENT '瑕疵披露(JSON数组)',
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '车辆上架标题',
  `deposit_amount` decimal(10, 2) NULL DEFAULT NULL COMMENT '动态阶梯定金',
  `third_party_report` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '第三方检测报告URL',
  `transfer_count` int(4) NULL DEFAULT 0 COMMENT '过户次数',
  `color` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '外观颜色',
  `insurance_expire_date` date NULL DEFAULT NULL COMMENT '交强险到期日',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_vin`(`vin_code`) USING BTREE,
  INDEX `idx_status_store`(`status`, `store_id`) USING BTREE COMMENT '组合索引提高查询效率'
) ENGINE = InnoDB AUTO_INCREMENT = 9 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '车辆库存SKU表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of car_sku
-- ----------------------------
INSERT INTO `car_sku` VALUES (1, 'LRW37111111111111', 1, 1, 1.20, '2022-05-12 00:00:00', 21.00, 19.50, 1, '[\"https://images.unsplash.com/photo-1560958089-b8a1929cea89\"]', '精品车况，个人一手，全车原漆，带官方延保。', 2, '2026-02-21 23:05:13', '2023年06月', '国VI', 96, '[\"无重大事故\", \"无火烧痕迹\", \"无泡水痕迹\"]', '[{\"desc\": \"2\", \"part\": \"1\"}, {\"desc\": \"2\", \"part\": \"11\"}]', NULL, NULL, NULL, 0, NULL, NULL);
INSERT INTO `car_sku` VALUES (2, 'WBA31111111111111', 2, 1, 3.50, '2021-08-20 00:00:00', 18.90, 17.00, 1, '[\"https://images.unsplash.com/photo-1555353540-64fd1b62386a\"]', '全程4S店记录，左前门局部补漆，余无瑕疵。', 2, '2026-02-21 23:05:13', '未知', '国VI', 100, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL);
INSERT INTO `car_sku` VALUES (3, 'LFV14111111111111', 3, 3, 4.20, '2021-03-15 00:00:00', 15.80, 14.20, 2, '[\"https://images.unsplash.com/photo-1621007947382-bb3c3994e3fd\"]', '个人一手车，内饰如新，刚做完大保养。', 0, '2026-02-21 23:05:13', '未知', '国VI', 100, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL);
INSERT INTO `car_sku` VALUES (4, 'LFV24111111111111', 4, 1, 5.80, '2020-11-10 00:00:00', 20.50, 18.20, 1, '[\"https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6\"]', '刚收回来，外观有少量划痕需抛光，机械状态优秀。', 0, '2026-02-21 23:05:13', '未知', '国VI', 100, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL);
INSERT INTO `car_sku` VALUES (5, 'LHG12111111111111', 5, 2, 2.10, '2022-02-28 00:00:00', 13.50, 12.00, 1, '[\"https://images.unsplash.com/photo-1568844293986-8d0400ba4715\"]', '性价比极高，因颜色冷门导致库存时间较长。', 2, '2026-02-21 23:05:13', '未知', '国VI', 100, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL);
INSERT INTO `car_sku` VALUES (6, '131313131313', 6, 1, 13.00, NULL, 13.00, NULL, 1, '[\"1\"]', NULL, 2, '2026-02-22 01:03:10', '2023年06月', '国VI', 98, '[\"无重大事故\", \"无火烧痕迹\", \"无泡水痕迹\", \"发动机/变速箱无大修\", \"1\", \"2\"]', '[{\"desc\": \"3\", \"part\": \"1\"}]', NULL, NULL, NULL, 0, NULL, NULL);
INSERT INTO `car_sku` VALUES (7, '1313', 1, 1, 3.00, NULL, 4.00, NULL, 2, '[]', NULL, 0, '2026-02-22 01:27:20', '2023年06月', '国VI', 98, '[\"无重大事故\", \"无火烧痕迹\", \"无泡水痕迹\", \"发动机/变速箱无大修\", \"1\", \"2\"]', '[{\"desc\": \"2\", \"part\": \"1\"}]', NULL, NULL, NULL, 0, NULL, NULL);
INSERT INTO `car_sku` VALUES (8, '1', 1, 1, 1.00, NULL, 3.00, NULL, 2, '[]', NULL, 0, NULL, '2023年06月', '国VI', 98, '[\"无重大事故\", \"无火烧痕迹\", \"无泡水痕迹\", \"发动机/变速箱无大修\", \"1\"]', '[{\"desc\": \"3\", \"part\": \"1\"}]', NULL, NULL, '', 0, NULL, NULL);

-- ----------------------------
-- Table structure for car_spu
-- ----------------------------
DROP TABLE IF EXISTS `car_spu`;
CREATE TABLE `car_spu`  (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `brand` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '品牌: 丰田',
  `series` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '车系: 凯美瑞',
  `year_model` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '款型年份: 2021款',
  `spu_name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '全称: 2021款 丰田 凯美瑞 2.5G 豪华版',
  `guide_price` decimal(10, 2) NULL DEFAULT NULL COMMENT '新车指导价(万)',
  `engine` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '发动机参数',
  `gearbox` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '变速箱类型',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 6 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '车型标准表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of car_spu
-- ----------------------------
INSERT INTO `car_spu` VALUES (1, '特斯拉', 'Model 3', '2022款', '2022款 特斯拉 Model 3 后轮驱动版', 23.59, '194kW (纯电动)', '固定齿比变速箱');
INSERT INTO `car_spu` VALUES (2, '宝马', '3系', '2021款', '2021款 宝马 3系 320Li M运动套装', 31.89, '2.0T 156马力 L4', '8挡手自一体');
INSERT INTO `car_spu` VALUES (3, '丰田', '凯美瑞', '2021款', '2021款 丰田 凯美瑞 2.5G 豪华版', 21.98, '2.5L 209马力 L4', '8挡手自一体');
INSERT INTO `car_spu` VALUES (4, '奥迪', 'A4L', '2020款', '2020款 奥迪 A4L 40 TFSI 时尚动感型', 31.88, '2.0T 190马力 L4', '7挡湿式双离合');
INSERT INTO `car_spu` VALUES (5, '本田', '思域', '2022款', '2022款 本田 思域 240TURBO CVT燃动版', 14.99, '1.5T 182马力 L4', 'CVT无级变速');

-- ----------------------------
-- Table structure for car_store
-- ----------------------------
DROP TABLE IF EXISTS `car_store`;
CREATE TABLE `car_store`  (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `store_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '门店名称',
  `address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '详细地址',
  `lng` double NULL DEFAULT NULL COMMENT '经度',
  `lat` double NULL DEFAULT NULL COMMENT '纬度',
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '门店电话',
  `create_time` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of car_store
-- ----------------------------

-- ----------------------------
-- Table structure for sys_store
-- ----------------------------
DROP TABLE IF EXISTS `sys_store`;
CREATE TABLE `sys_store`  (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '门店ID',
  `store_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '门店名称',
  `city` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '所属城市',
  `detail_address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '详细地址(含门牌号)',
  `longitude` decimal(10, 6) NOT NULL COMMENT '经度',
  `latitude` decimal(10, 6) NOT NULL COMMENT '纬度',
  `contact_phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '联系电话',
  `status` tinyint(4) NULL DEFAULT 1 COMMENT '状态: 1-营业, 0-停业',
  `create_time` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_location`(`longitude`, `latitude`) USING BTREE COMMENT '空间索引优化距离计算'
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '门店信息表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of sys_store
-- ----------------------------
INSERT INTO `sys_store` VALUES (1, 'AutoMax 高新旗舰店', '成都市', '武侯区天府三街 188 号腾讯成都大厦旁', 104.067890, 30.551230, '400-888-0001', 1, '2026-02-21 23:05:09');
INSERT INTO `sys_store` VALUES (2, 'AutoMax 龙泉驿店', '成都市', '龙泉驿区成龙大道二段 1666 号经开区汽车城', 104.223450, 30.567890, '400-888-0002', 1, '2026-02-21 23:05:09');
INSERT INTO `sys_store` VALUES (3, 'AutoMax 武侯直营店', '成都市', '武侯区二环路西一段 15 号', 104.023450, 30.634560, '400-888-0003', 1, '2026-02-21 23:05:09');

-- ----------------------------
-- Table structure for sys_user
-- ----------------------------
DROP TABLE IF EXISTS `sys_user`;
CREATE TABLE `sys_user`  (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '用户名',
  `password` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '密码',
  `role` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '角色: USER(去B端), ADMIN(去C端)',
  `create_time` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '手机号',
  `store_id` bigint(20) NULL DEFAULT NULL COMMENT '所属门店ID(B端员工专属)',
  `avatar` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '头像',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_username`(`username`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '系统用户表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of sys_user
-- ----------------------------
INSERT INTO `sys_user` VALUES (1, 'staff01', '123456', 'STAFF', '2026-02-22 15:20:55', NULL, 1, NULL);
INSERT INTO `sys_user` VALUES (2, 'customer01', '123456', 'CUSTOMER', '2026-02-22 15:20:55', NULL, NULL, NULL);
INSERT INTO `sys_user` VALUES (3, 'admin', '123456', 'ADMIN', '2026-02-22 19:44:51', NULL, NULL, NULL);

-- ----------------------------
-- Table structure for trade_order
-- ----------------------------
DROP TABLE IF EXISTS `trade_order`;
CREATE TABLE `trade_order`  (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `order_no` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '订单流水号',
  `user_id` bigint(20) NOT NULL COMMENT '买家ID',
  `sku_id` bigint(20) NOT NULL COMMENT '车辆SKU_ID',
  `store_id` bigint(20) NOT NULL COMMENT '订单归属门店',
  `pay_amount` decimal(10, 2) NOT NULL COMMENT '实际支付金额(意向金)',
  `status` tinyint(4) NULL DEFAULT 0 COMMENT '状态: 0-待支付, 1-已锁单, 2-已成交, 3-已取消, 4-已退款',
  `expire_time` datetime NULL DEFAULT NULL COMMENT '支付倒计时截止时间',
  `create_time` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `total_amount` decimal(10, 2) NULL DEFAULT NULL COMMENT '车辆成交总价',
  `appointment_time` datetime NULL DEFAULT NULL COMMENT '用户预约到店时间',
  `appointment_remark` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '预约备注',
  `appointment_update_time` datetime NULL DEFAULT NULL COMMENT '预约信息更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_order_no`(`order_no`) USING BTREE,
  INDEX `idx_user_time`(`user_id`, `create_time`) USING BTREE COMMENT '用户订单查询符合索引'
) ENGINE = InnoDB AUTO_INCREMENT = 6 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '交易订单表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of trade_order
-- ----------------------------
INSERT INTO `trade_order` VALUES (1, 'ORD202602210001', 1001, 2, 1, 0.05, 6, '2026-02-24 12:00:00', '2026-02-21 23:05:16', NULL, NULL, NULL, NULL);
INSERT INTO `trade_order` VALUES (2, 'ORD202602200022', 1002, 3, 3, 15.80, 3, NULL, '2026-02-21 23:05:16', NULL, NULL, NULL, NULL);
INSERT INTO `trade_order` VALUES (3, 'AUTO-380A8851', 1, 5, 2, 500.00, 6, NULL, '2026-02-22 00:24:40', NULL, NULL, NULL, NULL);
INSERT INTO `trade_order` VALUES (4, 'AUTO-A9B820CA', 1, 6, 1, 500.00, 6, NULL, '2026-02-22 01:04:06', NULL, NULL, NULL, NULL);
INSERT INTO `trade_order` VALUES (5, 'AUTO-827132C6', 1, 1, 1, 500.00, 6, NULL, '2026-02-22 13:38:25', NULL, NULL, NULL, NULL);

SET FOREIGN_KEY_CHECKS = 1;
