package com.gr1.exam.core.utils;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Random;

/**
 * Tiện ích xáo trộn cho thuật toán trộn đề.
 * Sử dụng Fisher-Yates Shuffle để đảm bảo tính ngẫu nhiên đồng đều.
 */
public final class ShuffleUtils {

    private ShuffleUtils() {
        // Utility class, không cho phép khởi tạo
    }

    /**
     * Xáo trộn danh sách và trả về danh sách mới (không thay đổi input).
     *
     * @param original Danh sách gốc
     * @param <T>      Kiểu phần tử
     * @return Danh sách đã xáo trộn
     */
    public static <T> List<T> shuffle(List<T> original) {
        List<T> shuffled = new ArrayList<>(original);
        Collections.shuffle(shuffled, new Random());
        return shuffled;
    }

    /**
     * Xáo trộn danh sách với seed cố định (cho mục đích test / reproduce).
     *
     * @param original Danh sách gốc
     * @param seed     Seed cho Random
     * @param <T>      Kiểu phần tử
     * @return Danh sách đã xáo trộn
     */
    public static <T> List<T> shuffle(List<T> original, long seed) {
        List<T> shuffled = new ArrayList<>(original);
        Collections.shuffle(shuffled, new Random(seed));
        return shuffled;
    }
}
