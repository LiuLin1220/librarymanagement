/*
 Navicat Premium Data Transfer

 Source Server         : root
 Source Server Type    : MySQL
 Source Server Version : 80019
 Source Host           : localhost:3306
 Source Schema         : librarymanagement

 Target Server Type    : MySQL
 Target Server Version : 80019
 File Encoding         : 65001

 Date: 02/12/2024 09:25:46
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for bookbaseinfo
-- ----------------------------
DROP TABLE IF EXISTS `bookbaseinfo`;
CREATE TABLE `bookbaseinfo`  (
  `ISBN` int NOT NULL COMMENT '书号，主键',
  `Title` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '书名',
  `Author` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '作者',
  `Publisher` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '出版社',
  `Price` decimal(10, 2) NOT NULL COMMENT '价格，保留两位小数',
  PRIMARY KEY (`ISBN`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '存储图书的基本信息' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of bookbaseinfo
-- ----------------------------
INSERT INTO `bookbaseinfo` VALUES (1001, '深入理解计算机系统', 'Randal E. Bryant, David R. O\'Hallaron', '机械工业出版社', 713.00);
INSERT INTO `bookbaseinfo` VALUES (1002, '算法导论', 'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein', '机械工业出版社', 89.00);
INSERT INTO `bookbaseinfo` VALUES (1003, '设计模式：可复用面向对象软件的基础', 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides', '机械工业出版社', 44.00);
INSERT INTO `bookbaseinfo` VALUES (1004, '代码大全', 'Steve McConnell', '电子工业出版社', 128.00);
INSERT INTO `bookbaseinfo` VALUES (1005, '计算机程序的构造和解释', 'Harold Abelson, Gerald Jay Sussman, Julie Sussman', '机械工业出版社', 119.00);
INSERT INTO `bookbaseinfo` VALUES (1006, '人月神话', 'Frederick P. Brooks Jr.', '清华大学出版社', 88.00);
INSERT INTO `bookbaseinfo` VALUES (1007, 'Effective C++：改善程序与设计的55个具体做法', 'Scott Meyers', '电子工业出版社', 49.00);
INSERT INTO `bookbaseinfo` VALUES (1008, 'Clean Code: A Handbook of Agile Software Craftsmanship', 'Robert C. Martin', 'Prentice Hall', 42.00);
INSERT INTO `bookbaseinfo` VALUES (1009, '重构：改善既有代码的设计', 'Martin Fowler', '人民邮电出版社', 99.00);
INSERT INTO `bookbaseinfo` VALUES (1010, '领域驱动设计：软件核心复杂性应对之道', 'Eric Evans', '人民邮电出版社', 109.00);
INSERT INTO `bookbaseinfo` VALUES (1011, '学习之道', 'Joshua Foer', '中国青年出版社', 55.00);
INSERT INTO `bookbaseinfo` VALUES (1013, '数学之美', '吴军', '人民邮电出版社', 89.05);

-- ----------------------------
-- Table structure for bookstorageinfo
-- ----------------------------
DROP TABLE IF EXISTS `bookstorageinfo`;
CREATE TABLE `bookstorageinfo`  (
  `StorageID` int NOT NULL AUTO_INCREMENT COMMENT '存储编号，主键',
  `ISBN` int NOT NULL COMMENT '书号，外键',
  `BookQuantity` int NOT NULL COMMENT '图书数量',
  PRIMARY KEY (`StorageID`) USING BTREE,
  INDEX `ISBN`(`ISBN` ASC) USING BTREE,
  CONSTRAINT `bookstorageinfo_ibfk_1` FOREIGN KEY (`ISBN`) REFERENCES `bookbaseinfo` (`ISBN`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 35 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '存储图书的存储信息' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of bookstorageinfo
-- ----------------------------
INSERT INTO `bookstorageinfo` VALUES (18, 1001, 19);
INSERT INTO `bookstorageinfo` VALUES (19, 1002, 3);
INSERT INTO `bookstorageinfo` VALUES (20, 1003, 0);
INSERT INTO `bookstorageinfo` VALUES (21, 1004, 0);
INSERT INTO `bookstorageinfo` VALUES (22, 1005, 0);
INSERT INTO `bookstorageinfo` VALUES (23, 1006, 0);
INSERT INTO `bookstorageinfo` VALUES (24, 1007, 0);
INSERT INTO `bookstorageinfo` VALUES (25, 1008, 0);
INSERT INTO `bookstorageinfo` VALUES (31, 1013, 10);
INSERT INTO `bookstorageinfo` VALUES (32, 1009, 0);
INSERT INTO `bookstorageinfo` VALUES (33, 1010, 0);
INSERT INTO `bookstorageinfo` VALUES (34, 1011, 2);

-- ----------------------------
-- Table structure for buyinfo
-- ----------------------------
DROP TABLE IF EXISTS `buyinfo`;
CREATE TABLE `buyinfo`  (
  `BuyID` int NOT NULL AUTO_INCREMENT COMMENT '采购编号，主键',
  `ISBN` int NOT NULL COMMENT '书号，外键',
  `BuyQuantity` int NOT NULL COMMENT '采购数量',
  `BuyAmount` decimal(10, 2) NOT NULL COMMENT '采购金额，保留两位小数',
  `BuyDate` date NOT NULL COMMENT '采购日期',
  PRIMARY KEY (`BuyID`) USING BTREE,
  INDEX `ISBN`(`ISBN` ASC) USING BTREE,
  CONSTRAINT `buyinfo_ibfk_1` FOREIGN KEY (`ISBN`) REFERENCES `bookbaseinfo` (`ISBN`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 13 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '存储图书的采购信息' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of buyinfo
-- ----------------------------
INSERT INTO `buyinfo` VALUES (7, 1001, 10, 1000.00, '2024-11-01');
INSERT INTO `buyinfo` VALUES (8, 1002, 10, 800.00, '2022-11-15');
INSERT INTO `buyinfo` VALUES (9, 1013, 10, 700.00, '2024-11-21');
INSERT INTO `buyinfo` VALUES (10, 1001, 8, 800.00, '2024-11-21');
INSERT INTO `buyinfo` VALUES (11, 1001, 10, 1000.40, '2024-11-07');
INSERT INTO `buyinfo` VALUES (12, 1011, 8, 400.00, '2024-11-04');
INSERT INTO `buyinfo` VALUES (13, 1001, 8, 400.00, '2024-10-30');

-- ----------------------------
-- Table structure for saleinfo
-- ----------------------------
DROP TABLE IF EXISTS `saleinfo`;
CREATE TABLE `saleinfo`  (
  `SaleID` int NOT NULL AUTO_INCREMENT COMMENT '销售编号，主键',
  `ISBN` int NOT NULL COMMENT '书号，外键',
  `SaleQuantity` int NOT NULL COMMENT '销售数量',
  `SaleAmount` decimal(10, 2) NOT NULL COMMENT '销售金额，保留两位小数',
  `SaleDate` date NOT NULL COMMENT '销售日期',
  PRIMARY KEY (`SaleID`) USING BTREE,
  INDEX `ISBN`(`ISBN` ASC) USING BTREE,
  CONSTRAINT `saleinfo_ibfk_1` FOREIGN KEY (`ISBN`) REFERENCES `bookbaseinfo` (`ISBN`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 19 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '存储图书的销售信息' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of saleinfo
-- ----------------------------
INSERT INTO `saleinfo` VALUES (11, 1002, 5, 500.00, '2024-11-06');
INSERT INTO `saleinfo` VALUES (12, 1001, 3, 300.00, '2024-07-12');
INSERT INTO `saleinfo` VALUES (13, 1002, 2, 200.00, '2024-07-16');
INSERT INTO `saleinfo` VALUES (14, 1001, 2, 320.00, '2024-11-14');
INSERT INTO `saleinfo` VALUES (15, 1001, 2, 320.00, '2024-07-14');
INSERT INTO `saleinfo` VALUES (16, 1001, 10, 800.00, '2024-11-14');
INSERT INTO `saleinfo` VALUES (17, 1011, 4, 250.00, '2024-12-05');
INSERT INTO `saleinfo` VALUES (18, 1011, 2, 120.00, '2024-12-12');

-- ----------------------------
-- View structure for 图书基本信息
-- ----------------------------
DROP VIEW IF EXISTS `图书基本信息`;
CREATE ALGORITHM = UNDEFINED SQL SECURITY DEFINER VIEW `图书基本信息` AS select `bookbaseinfo`.`ISBN` AS `书号`,`bookbaseinfo`.`Title` AS `书名`,`bookbaseinfo`.`Author` AS `作者`,`bookbaseinfo`.`Publisher` AS `出版社`,`bookbaseinfo`.`Price` AS `价格（元）` from `bookbaseinfo`;

-- ----------------------------
-- View structure for 图书数量
-- ----------------------------
DROP VIEW IF EXISTS `图书数量`;
CREATE ALGORITHM = UNDEFINED SQL SECURITY DEFINER VIEW `图书数量` AS select `bookbaseinfo`.`ISBN` AS `书号`,`bookbaseinfo`.`Title` AS `书名`,`bookbaseinfo`.`Author` AS `作者`,`bookstorageinfo`.`BookQuantity` AS `数量` from (`bookbaseinfo` join `bookstorageinfo` on((`bookbaseinfo`.`ISBN` = `bookstorageinfo`.`ISBN`)));

-- ----------------------------
-- View structure for 图书采购
-- ----------------------------
DROP VIEW IF EXISTS `图书采购`;
CREATE ALGORITHM = UNDEFINED SQL SECURITY DEFINER VIEW `图书采购` AS select `bookbaseinfo`.`Title` AS `书名`,`bookbaseinfo`.`Author` AS `作者`,`buyinfo`.`BuyQuantity` AS `采购数量`,`buyinfo`.`BuyAmount` AS `采购金额`,`buyinfo`.`BuyDate` AS `采购日期` from (`bookbaseinfo` join `buyinfo` on((`bookbaseinfo`.`ISBN` = `buyinfo`.`ISBN`)));

-- ----------------------------
-- View structure for 图书销售
-- ----------------------------
DROP VIEW IF EXISTS `图书销售`;
CREATE ALGORITHM = UNDEFINED SQL SECURITY DEFINER VIEW `图书销售` AS select `bookbaseinfo`.`Title` AS `书名`,`bookbaseinfo`.`Author` AS `作者`,`saleinfo`.`SaleQuantity` AS `销售数量`,`saleinfo`.`SaleAmount` AS `销售金额`,`saleinfo`.`SaleDate` AS `销售日期` from (`bookbaseinfo` join `saleinfo` on((`bookbaseinfo`.`ISBN` = `saleinfo`.`ISBN`)));

-- ----------------------------
-- Procedure structure for get_book_buy
-- ----------------------------
DROP PROCEDURE IF EXISTS `get_book_buy`;
delimiter ;;
CREATE PROCEDURE `get_book_buy`(IN rq date)
BEGIN
    SELECT *
    FROM 图书采购
    WHERE `采购日期` = rq;
END
;;
delimiter ;

-- ----------------------------
-- Procedure structure for get_book_num
-- ----------------------------
DROP PROCEDURE IF EXISTS `get_book_num`;
delimiter ;;
CREATE PROCEDURE `get_book_num`(IN book_id INT)
BEGIN
    SELECT `书号`, `书名`, `作者`, `数量`
    FROM 图书数量
    WHERE `书号` = book_id;
END
;;
delimiter ;

-- ----------------------------
-- Procedure structure for get_book_sale
-- ----------------------------
DROP PROCEDURE IF EXISTS `get_book_sale`;
delimiter ;;
CREATE PROCEDURE `get_book_sale`(IN rq date)
BEGIN
    SELECT *
    FROM 图书销售
    WHERE `销售日期` = rq;
END
;;
delimiter ;

-- ----------------------------
-- Procedure structure for get_book_sale_month
-- ----------------------------
DROP PROCEDURE IF EXISTS `get_book_sale_month`;
delimiter ;;
CREATE PROCEDURE `get_book_sale_month`(IN yearMonth VARCHAR(8))
BEGIN
    SELECT `书名`, 
           `作者`, 
           SUM(`销售数量`) AS 总销售数量, 
           SUM(`销售金额`) AS 总销售金额
    FROM `图书销售`
    WHERE DATE_FORMAT(`销售日期`, '%Y-%m') = yearMonth
    GROUP BY `书名`, `作者`;
END
;;
delimiter ;

-- ----------------------------
-- Triggers structure for table bookbaseinfo
-- ----------------------------
DROP TRIGGER IF EXISTS `AfterBookInsert`;
delimiter ;;
CREATE TRIGGER `AfterBookInsert` AFTER INSERT ON `bookbaseinfo` FOR EACH ROW BEGIN
    INSERT INTO bookstorageinfo (StorageID, ISBN, BookQuantity)
    VALUES (NULL, NEW.ISBN, 0);
END
;;
delimiter ;

-- ----------------------------
-- Triggers structure for table buyinfo
-- ----------------------------
DROP TRIGGER IF EXISTS `buy_book`;
delimiter ;;
CREATE TRIGGER `buy_book` AFTER INSERT ON `buyinfo` FOR EACH ROW update bookstorageinfo set BookQuantity=BookQuantity+new.BuyQuantity where bookstorageinfo.ISBN=new.ISBN
;;
delimiter ;

-- ----------------------------
-- Triggers structure for table saleinfo
-- ----------------------------
DROP TRIGGER IF EXISTS `sale_book`;
delimiter ;;
CREATE TRIGGER `sale_book` AFTER INSERT ON `saleinfo` FOR EACH ROW update bookstorageinfo set BookQuantity=BookQuantity-new.SaleQuantity where bookstorageinfo.ISBN=new.ISBN
;;
delimiter ;

SET FOREIGN_KEY_CHECKS = 1;
