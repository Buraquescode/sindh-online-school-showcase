import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_text_styles.dart';
import '../../../core/constants/app_routes.dart';
import '../../../providers/locale_provider.dart';
import '../../../providers/content_provider.dart';
import '../../../models/class_model.dart';
import '../../../models/topic_model.dart';
import '../../widgets/topic_tile.dart';

class ClassDetailScreen extends StatefulWidget {
  final String classId;
  final ClassModel? classModel;

  const ClassDetailScreen({
    super.key,
    required this.classId,
    this.classModel,
  });

  @override
  State<ClassDetailScreen> createState() => _ClassDetailScreenState();
}

class _ClassDetailScreenState extends State<ClassDetailScreen> {
  String? _selectedSubjectId;
  bool _subjectAutoSelected = false;

  // ✅ Track whether the subject data has fully loaded (chapters + directTopics)
  bool _subjectDataLoading = false;

  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _init());
  }

  void _init() {
    if (!mounted) return;
    final contentProvider = context.read<ContentProvider>();

    contentProvider.onSubjectsLoaded = () {
      if (!mounted) return;
      final subjects = context.read<ContentProvider>().subjects;
      if (subjects.isEmpty || _subjectAutoSelected) return;
      _subjectAutoSelected = true;

      // ✅ Use the actual first subject ID directly — don't rely on provider
      // state which may have been cleared by forceSelectClass
      final firstId = subjects.first.id;
      if (!mounted) return;
      setState(() {
        _selectedSubjectId = firstId;
        _subjectDataLoading = true;
      });
      context.read<ContentProvider>().selectSubject(firstId).then((_) {
        if (mounted) setState(() => _subjectDataLoading = false);
      });
    };

    contentProvider.forceSelectClass(widget.classId);
  }

  Future<void> _selectSubject(String subjectId) async {
    // ✅ Guard: don't re-select the same subject
    if (_selectedSubjectId == subjectId) return;
    if (!mounted) return;

    setState(() {
      _selectedSubjectId = subjectId;
      _subjectDataLoading = true;
    });

    // ✅ Await so we know when chapters + directTopics have been fetched
    await context.read<ContentProvider>().selectSubject(subjectId);

    if (mounted) setState(() => _subjectDataLoading = false);
  }

  @override
  void dispose() {
    try {
      context.read<ContentProvider>().onSubjectsLoaded = null;
    } catch (_) {}
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final localeProvider = context.watch<LocaleProvider>();
    final contentProvider = context.watch<ContentProvider>();
    final isEnglish = localeProvider.isEnglish;
    final selectedClass = contentProvider.selectedClass ?? widget.classModel;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            if (context.canPop()) {
              context.pop();
            } else {
              context.go(AppRoutes.home);
            }
          },
        ),
        title: Text(
          selectedClass != null
              ? selectedClass
                  .getLocalizedName(localeProvider.currentLanguageCode)
              : (isEnglish ? 'Class Details' : 'جماعت جي تفصيل'),
          style: AppTextStyles.headingH5,
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(56),
          child: _buildSubjectPills(contentProvider, localeProvider),
        ),
      ),
      body: _buildBody(contentProvider, localeProvider, isEnglish),
    );
  }

  Widget _buildBody(
    ContentProvider contentProvider,
    LocaleProvider localeProvider,
    bool isEnglish,
  ) {
    // ── No subjects yet ────────────────────────────────────────────
    if (contentProvider.subjects.isEmpty || _selectedSubjectId == null) {
      return const Center(
        child: CircularProgressIndicator(color: AppColors.primary),
      );
    }

    // ── Subject data is loading (chapters + directTopics) ──────────
    // ✅ Use our local flag instead of contentProvider.isLoading so we
    // don't show a spinner when an unrelated part of the provider is loading
    if (_subjectDataLoading) {
      return const Center(
        child: CircularProgressIndicator(color: AppColors.primary),
      );
    }

    final hasChapters = contentProvider.chapters.isNotEmpty;
    final hasDirectTopics = contentProvider.directTopics.isNotEmpty;

    // ── Has direct topics (no-chapter subject) ─────────────────────
    if (hasDirectTopics && !hasChapters) {
      return _buildDirectTopicsList(
        contentProvider.directTopics,
        localeProvider,
        isEnglish,
      );
    }

    // ── Has chapters → show chapter cards ──────────────────────────
    if (hasChapters) {
      return ListView.builder(
        controller: _scrollController,
        padding: const EdgeInsets.all(16),
        itemCount: contentProvider.chapters.length,
        itemBuilder: (context, index) {
          final chapter = contentProvider.chapters[index];
          return _buildChapterCard(chapter, isEnglish);
        },
      );
    }

    // ── Has both or neither: subject just loaded with no content ───
    // Give it one more frame — streams may still be resolving
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.book_outlined, size: 64, color: AppColors.textLight),
          const SizedBox(height: 16),
          Text(
            isEnglish ? 'No content available' : 'ڪو به مواد موجود نه آهي',
            style: AppTextStyles.bodyLarge
                .copyWith(color: AppColors.textSecondary),
          ),
        ],
      ),
    );
  }

  Widget _buildDirectTopicsList(
    List<TopicModel> topics,
    LocaleProvider localeProvider,
    bool isEnglish,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          color: AppColors.primary.withOpacity(0.06),
          child: Row(
            children: [
              const Icon(Icons.play_circle_outline,
                  size: 18, color: AppColors.primary),
              const SizedBox(width: 8),
              Text(
                isEnglish
                    ? '${topics.length} video${topics.length == 1 ? '' : 's'} available'
                    : '${topics.length} وڊيوز موجود آهن',
                style: AppTextStyles.bodyMedium.copyWith(
                  color: AppColors.primary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
        Expanded(
          child: ListView.builder(
            controller: _scrollController,
            padding: const EdgeInsets.symmetric(vertical: 8),
            itemCount: topics.length,
            itemBuilder: (context, index) {
              final topic = topics[index];
              return TopicTile(
                topic: topic,
                onTap: () => context.push(AppRoutes.video, extra: topic),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildSubjectPills(
      ContentProvider contentProvider, LocaleProvider localeProvider) {
    if (contentProvider.subjects.isEmpty) return const SizedBox.shrink();

    return SizedBox(
      height: 48,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: contentProvider.subjects.length,
        itemBuilder: (context, index) {
          final subject = contentProvider.subjects[index];

          // ✅ Compare against local _selectedSubjectId — this is the
          // ground truth for which pill is highlighted, not the provider's
          // _selectedSubjectId which gets cleared on forceSelectClass
          final isSelected = _selectedSubjectId == subject.id;

          return Padding(
            padding: const EdgeInsets.only(right: 8, top: 6, bottom: 6),
            child: FilterChip(
              materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
              visualDensity: VisualDensity.compact,
              label: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 110),
                child: Text(
                  subject.getLocalizedName(localeProvider.currentLanguageCode),
                  overflow: TextOverflow.ellipsis,
                  maxLines: 1,
                  style: TextStyle(
                    fontSize: 13,
                    color: isSelected ? Colors.white : AppColors.primary,
                    fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                  ),
                ),
              ),
              selected: isSelected,
              onSelected: (_) => _selectSubject(subject.id),
              backgroundColor: Colors.white,
              selectedColor: AppColors.primary,
              showCheckmark: false,
              side: BorderSide(
                color: isSelected
                    ? AppColors.primary
                    : AppColors.primary.withOpacity(0.5),
                width: 1.5,
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildChapterCard(chapter, bool isEnglish) {
    final localeProvider = context.watch<LocaleProvider>();
    final chapterName =
        chapter.getLocalizedName(localeProvider.currentLanguageCode);

    return GestureDetector(
      onTap: () {
        context.push(
          AppRoutes.getChapterTopics(
            widget.classId,
            // ✅ Always use local _selectedSubjectId — never chapter.subjectId
            // which may be stale from a previous subject selection
            _selectedSubjectId ?? chapter.subjectId,
            chapter.id,
          ),
          extra: chapter,
        );
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.grey.withOpacity(0.08),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Center(
                child: Text(
                  chapter.order.toString(),
                  style: AppTextStyles.headingH6.copyWith(
                    color: AppColors.primary,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    chapterName,
                    style: AppTextStyles.bodyLarge
                        .copyWith(fontWeight: FontWeight.w600),
                    overflow: TextOverflow.ellipsis,
                    maxLines: 2,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    isEnglish
                        ? 'Chapter ${chapter.order}'
                        : 'باب ${chapter.order}',
                    style: AppTextStyles.bodySmall,
                  ),
                ],
              ),
            ),
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Icon(
                Icons.chevron_right,
                size: 20,
                color: AppColors.primary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
