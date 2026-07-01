import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_text_styles.dart';
import '../../../providers/locale_provider.dart';
import '../../../providers/content_provider.dart';
import '../../../models/notification_model.dart';
import 'package:flutter/material.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final ScrollController _scrollController = ScrollController();
  bool _isRefreshing = false;

  @override
  void initState() {
    super.initState();
    _loadNotifications();
  }

  Future<void> _loadNotifications() async {
    final contentProvider = context.read<ContentProvider>();
    await contentProvider.loadNotifications();
  }

  Future<void> _refreshNotifications() async {
    setState(() {
      _isRefreshing = true;
    });
    await _loadNotifications();
    setState(() {
      _isRefreshing = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final localeProvider = context.watch<LocaleProvider>();
    final contentProvider = context.watch<ContentProvider>();
    final isEnglish = localeProvider.isEnglish;
    final notifications = contentProvider.notifications;
    final isLoading = contentProvider.isLoading;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          isEnglish ? 'Notifications' : 'اطلاعات',
          style: AppTextStyles.headingH5,
        ),
        centerTitle: true,
      ),
      body: RefreshIndicator(
        onRefresh: _refreshNotifications,
        color: AppColors.primary,
        child: _buildBody(
          isLoading,
          notifications,
          isEnglish,
          contentProvider.error,
        ),
      ),
    );
  }

  Widget _buildBody(
    bool isLoading,
    List<NotificationModel> notifications,
    bool isEnglish,
    String? error,
  ) {
    if (isLoading && notifications.isEmpty) {
      return _buildLoadingState(isEnglish);
    }

    if (error != null && notifications.isEmpty) {
      return _buildErrorState(isEnglish, error);
    }

    if (notifications.isEmpty) {
      return _buildEmptyState(isEnglish);
    }

    return ListView.builder(
      controller: _scrollController,
      padding: const EdgeInsets.all(16),
      itemCount: notifications.length,
      itemBuilder: (context, index) {
        final notification = notifications[index];
        return _buildNotificationCard(notification, isEnglish);
      },
    );
  }

  Widget _buildNotificationCard(
      NotificationModel notification, bool isEnglish) {
    final localeProvider = context.watch<LocaleProvider>();
    final title =
        notification.getLocalizedTitle(localeProvider.currentLanguageCode);
    final body =
        notification.getLocalizedBody(localeProvider.currentLanguageCode);
    final createdAt = notification.createdAt;

    String timeAgo = '';
    if (createdAt != null) {
      final now = DateTime.now();
      final difference = now.difference(createdAt);

      if (difference.inDays > 7) {
        timeAgo = DateFormat('MMM d, yyyy').format(createdAt);
      } else if (difference.inDays > 0) {
        timeAgo = isEnglish
            ? '${difference.inDays} day${difference.inDays > 1 ? 's' : ''} ago'
            : '${difference.inDays} ڏينهن اڳ';
      } else if (difference.inHours > 0) {
        timeAgo = isEnglish
            ? '${difference.inHours} hour${difference.inHours > 1 ? 's' : ''} ago'
            : '${difference.inHours} ڪلاڪ اڳ';
      } else if (difference.inMinutes > 0) {
        timeAgo = isEnglish
            ? '${difference.inMinutes} minute${difference.inMinutes > 1 ? 's' : ''} ago'
            : '${difference.inMinutes} منٽ اڳ';
      } else {
        timeAgo = isEnglish ? 'Just now' : 'هاڻي';
      }
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.05),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Notification Icon
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Icon(
              notification.classId != null
                  ? Icons.class_outlined
                  : Icons.notifications_outlined,
              color: AppColors.primary,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),

          // Content
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: AppTextStyles.bodyLarge.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  body,
                  style: AppTextStyles.bodyMedium.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  timeAgo,
                  style: AppTextStyles.bodySmall.copyWith(
                    color: AppColors.textLight,
                  ),
                ),
              ],
            ),
          ),

          // Unread indicator
          if (notification.isActive)
            Container(
              width: 8,
              height: 8,
              decoration: const BoxDecoration(
                color: AppColors.primary,
                shape: BoxShape.circle,
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildLoadingState(bool isEnglish) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: 5,
      itemBuilder: (context, index) {
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.grey[200],
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      height: 16,
                      width: double.infinity,
                      color: Colors.grey[300],
                    ),
                    const SizedBox(height: 8),
                    Container(
                      height: 12,
                      width: 150,
                      color: Colors.grey[300],
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildEmptyState(bool isEnglish) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(
            Icons.notifications_none_outlined,
            size: 80,
            color: AppColors.textLight,
          ),
          const SizedBox(height: 16),
          Text(
            isEnglish ? 'No notifications yet' : 'اڃا تائين ڪي به اطلاع نه آهن',
            style: AppTextStyles.bodyLarge.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 8),
          GestureDetector(
            onTap: _refreshNotifications,
            child: Text(
              isEnglish ? 'Tap to refresh' : 'ريفريش ڪرڻ لاءِ ٽيپ ڪريو',
              style: AppTextStyles.bodySmall.copyWith(
                color: AppColors.primary,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState(bool isEnglish, String error) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.error_outline,
            size: 80,
            color: Colors.red[400],
          ),
          const SizedBox(height: 16),
          Text(
            isEnglish ? 'Something went wrong' : 'ڪا غلطي ٿي وئي',
            style: AppTextStyles.bodyLarge.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            error,
            style: AppTextStyles.bodySmall.copyWith(
              color: AppColors.textLight,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: _refreshNotifications,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
            ),
            child: Text(isEnglish ? 'Try Again' : 'ٻيهر ڪوشش ڪريو'),
          ),
        ],
      ),
    );
  }
}
