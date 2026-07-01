// lib/presentation/screens/home/home_content.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shimmer/shimmer.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_text_styles.dart';
import '../../../providers/locale_provider.dart';
import '../../../providers/content_provider.dart';
import '../../../models/class_model.dart';
import '../../../models/section_model.dart';
import '../../../core/constants/app_routes.dart';

class HomeContent extends StatefulWidget {
  const HomeContent({super.key});

  @override
  State<HomeContent> createState() => _HomeContentState();
}

class _HomeContentState extends State<HomeContent> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadContent());
  }

  Future<void> _loadContent() async {
    if (!mounted) return;
    final cp = context.read<ContentProvider>();
    await cp.loadClasses();
    await cp.loadNotifications();
    cp.loadOtherSections();
  }

  @override
  Widget build(BuildContext context) {
    final localeProvider = context.watch<LocaleProvider>();
    final contentProvider = context.watch<ContentProvider>();
    final isEnglish = localeProvider.isEnglish;

    return RefreshIndicator(
      color: AppColors.primary,
      onRefresh: _loadContent,
      child: CustomScrollView(
        slivers: [
          // ── Hero Banner ──────────────────────────────────────────
          SliverToBoxAdapter(child: _buildHero(isEnglish)),

          // ── Classes heading ──────────────────────────────────────
          SliverToBoxAdapter(
            child: _SectionHeader(
              title: isEnglish ? 'Classes' : 'جماعتون',
              subtitle: isEnglish
                  ? 'STBB Syllabus video lectures'
                  : 'ايس ٽي بي بي نصاب مطابق وڊيو ليڪچر',
            ),
          ),

          // ── Classes grid ─────────────────────────────────────────
          contentProvider.isLoading
              ? SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  sliver: SliverGrid(
                    delegate: SliverChildBuilderDelegate(
                      (_, __) => _ShimmerCard(),
                      childCount: 6,
                    ),
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      childAspectRatio: 1.25,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                    ),
                  ),
                )
              : SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  sliver: SliverGrid(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) => _ClassCard(
                        classModel: contentProvider.classes[index],
                        colorIndex: index,
                      ),
                      childCount: contentProvider.classes.length,
                    ),
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      childAspectRatio: 1.25,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                    ),
                  ),
                ),

          // ── Other Sections ───────────────────────────────────────
          if (contentProvider.otherSections.isNotEmpty) ...[
            SliverToBoxAdapter(
              child: _SectionHeader(
                title: isEnglish ? 'Other Sections' : 'ٻيا سيڪشن',
                subtitle: isEnglish
                    ? 'Extra learning resources'
                    : 'اضافي سکيا جا وسيلا',
              ),
            ),
            SliverToBoxAdapter(
              child:
                  _buildOtherSections(contentProvider.otherSections, isEnglish),
            ),
          ],

          // ── Stats banner ─────────────────────────────────────────
          SliverToBoxAdapter(child: _buildStatsBanner(isEnglish)),

          // ── Social ───────────────────────────────────────────────
          SliverToBoxAdapter(child: _buildSocialRow()),

          const SliverToBoxAdapter(child: SizedBox(height: 100)),
        ],
      ),
    );
  }

  // ── Hero ────────────────────────────────────────────────────────
  Widget _buildHero(bool isEnglish) {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      height: 160,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        gradient: const LinearGradient(
          colors: [Color(0xFF5C6BC0), Color(0xFF26C6DA)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withOpacity(0.35),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Stack(
        children: [
          // Decorative circles
          Positioned(
            right: -20,
            top: -20,
            child: Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withOpacity(0.08),
              ),
            ),
          ),
          Positioned(
            right: 40,
            bottom: -30,
            child: Container(
              width: 90,
              height: 90,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withOpacity(0.06),
              ),
            ),
          ),
          // Content
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    isEnglish
                        ? '🎓 Free Education for All'
                        : '🎓 سڀني لاءِ مفت تعليم',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  isEnglish ? 'Sindh Online\nSchool' : 'سنڌ آن لائن\nاسڪول',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 26,
                    fontWeight: FontWeight.w800,
                    height: 1.1,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  isEnglish ? 'Learn anytime, anywhere' : 'ڪٿي به، ڪڏهن به سکو',
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.85),
                    fontSize: 13,
                  ),
                ),
              ],
            ),
          ),
          // Book icon
          Positioned(
            right: 20,
            bottom: 16,
            child: Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.18),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.school_rounded,
                  color: Colors.white, size: 30),
            ),
          ),
        ],
      ),
    );
  }

  // ── Other Sections horizontal list ──────────────────────────────
  Widget _buildOtherSections(List<SectionModel> sections, bool isEnglish) {
    // Distinct accent colors cycling per section
    final colors = [
      const Color(0xFFFF6B6B),
      const Color(0xFFFFB347),
      const Color(0xFF4ECDC4),
      const Color(0xFF45B7D1),
      const Color(0xFF96CEB4),
      const Color(0xFFA78BFA),
    ];

    return SizedBox(
      height: 120,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: sections.length,
        itemBuilder: (context, index) {
          final section = sections[index];
          final color = colors[index % colors.length];
          return GestureDetector(
            onTap: () => context.pushNamed(
              'section_topics',
              pathParameters: {'sectionId': section.id},
              extra: section,
            ),
            child: Container(
              width: 110,
              margin: const EdgeInsets.only(right: 12),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: color.withOpacity(0.25), width: 1.5),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    width: 46,
                    height: 46,
                    decoration: BoxDecoration(
                      color: color.withOpacity(0.15),
                      shape: BoxShape.circle,
                    ),
                    child: section.iconUrl.isNotEmpty
                        ? ClipOval(
                            child: Image.network(
                              section.iconUrl,
                              fit: BoxFit.cover,
                              errorBuilder: (_, __, ___) => Icon(
                                Icons.play_lesson_rounded,
                                color: color,
                                size: 24,
                              ),
                            ),
                          )
                        : Icon(Icons.play_lesson_rounded,
                            color: color, size: 24),
                  ),
                  const SizedBox(height: 8),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 6),
                    child: Text(
                      isEnglish ? section.nameEn : section.nameSd,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary,
                      ),
                      textAlign: TextAlign.center,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  // ── Stats banner ────────────────────────────────────────────────
  Widget _buildStatsBanner(bool isEnglish) {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 24, 16, 8),
      padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 8),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          _StatItem(
              icon: Icons.school_rounded,
              value: '10+',
              label: isEnglish ? 'Classes' : 'جماعتون',
              color: AppColors.primary),
          _Divider(),
          _StatItem(
              icon: Icons.menu_book_rounded,
              value: '50+',
              label: isEnglish ? 'Subjects' : 'مضمون',
              color: const Color(0xFF26C6DA)),
          _Divider(),
          _StatItem(
              icon: Icons.play_circle_rounded,
              value: '200+',
              label: isEnglish ? 'Videos' : 'وڊيوز',
              color: const Color(0xFFFF6B6B)),
        ],
      ),
    );
  }

  // ── Social row ──────────────────────────────────────────────────
  Widget _buildSocialRow() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          Expanded(
            child: _SocialButton(
              icon: Icons.facebook_rounded,
              label: 'Facebook',
              color: const Color(0xFF1877F2),
              onTap: () {},
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: _SocialButton(
              icon: Icons.play_circle_filled_rounded,
              label: 'YouTube',
              color: const Color(0xFFFF0000),
              onTap: () {},
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: _SocialButton(
              icon: Icons.chat_rounded,
              label: 'WhatsApp',
              color: const Color(0xFF25D366),
              onTap: () {},
            ),
          ),
        ],
      ),
    );
  }
}

// ── Section Header ───────────────────────────────────────────────────────────
class _SectionHeader extends StatelessWidget {
  final String title;
  final String subtitle;

  const _SectionHeader({required this.title, required this.subtitle});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 24, 16, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title,
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w800,
                color: Color(0xFF2C3E50),
              )),
          const SizedBox(height: 2),
          Text(subtitle,
              style: const TextStyle(
                fontSize: 12,
                color: Color(0xFF7F8C8D),
              )),
        ],
      ),
    );
  }
}

// ── Class Card ───────────────────────────────────────────────────────────────
// Gradient palette — one per card index
const _kCardGradients = [
  [Color(0xFF667EEA), Color(0xFF764BA2)],
  [Color(0xFFF093FB), Color(0xFFF5576C)],
  [Color(0xFF4FACFE), Color(0xFF00F2FE)],
  [Color(0xFF43E97B), Color(0xFF38F9D7)],
  [Color(0xFFFA709A), Color(0xFFFEE140)],
  [Color(0xFF30CFD0), Color(0xFF330867)],
  [Color(0xFFA18CD1), Color(0xFFFBC2EB)],
  [Color(0xFFFFD26F), Color(0xFF3677FF)],
  [Color(0xFF11998E), Color(0xFF38EF7D)],
  [Color(0xFFEB3349), Color(0xFFF45C43)],
];

class _ClassCard extends StatelessWidget {
  final ClassModel classModel;
  final int colorIndex;

  const _ClassCard({required this.classModel, required this.colorIndex});

  @override
  Widget build(BuildContext context) {
    final localeProvider = context.watch<LocaleProvider>();
    final name =
        classModel.getLocalizedName(localeProvider.currentLanguageCode);
    final grad = _kCardGradients[colorIndex % _kCardGradients.length];

    return GestureDetector(
      onTap: () => context.push(
        AppRoutes.getClassDetail(classModel.id),
        extra: classModel,
      ),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          gradient: LinearGradient(
            colors: grad,
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          boxShadow: [
            BoxShadow(
              color: grad[0].withOpacity(0.40),
              blurRadius: 12,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Stack(
          children: [
            // Decorative circle top-right
            Positioned(
              right: -16,
              top: -16,
              child: Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white.withOpacity(0.12),
                ),
              ),
            ),
            Positioned(
              left: -10,
              bottom: -10,
              child: Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white.withOpacity(0.08),
                ),
              ),
            ),
            // Content
            Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Top: icon badge
                  Container(
                    width: 38,
                    height: 38,
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.22),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.school_rounded,
                        color: Colors.white, size: 22),
                  ),
                  // Bottom: name + arrow
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        name,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          height: 1.2,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          Text(
                            'Explore',
                            style: TextStyle(
                              color: Colors.white.withOpacity(0.85),
                              fontSize: 11,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          const SizedBox(width: 2),
                          Icon(Icons.arrow_forward_rounded,
                              color: Colors.white.withOpacity(0.85), size: 12),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Stat Item ─────────────────────────────────────────────────────────────────
class _StatItem extends StatelessWidget {
  final IconData icon;
  final String value;
  final String label;
  final Color color;

  const _StatItem(
      {required this.icon,
      required this.value,
      required this.label,
      required this.color});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            color: color.withOpacity(0.12),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: color, size: 22),
        ),
        const SizedBox(height: 6),
        Text(value,
            style: TextStyle(
                fontSize: 18, fontWeight: FontWeight.w800, color: color)),
        Text(label,
            style: const TextStyle(fontSize: 11, color: Color(0xFF7F8C8D))),
      ],
    );
  }
}

class _Divider extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(width: 1, height: 48, color: const Color(0xFFECECEC));
  }
}

// ── Social Button ─────────────────────────────────────────────────────────────
class _SocialButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _SocialButton(
      {required this.icon,
      required this.label,
      required this.color,
      required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: color.withOpacity(0.08),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: color.withOpacity(0.2), width: 1),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 26),
            const SizedBox(height: 4),
            Text(label,
                style: TextStyle(
                    fontSize: 11, fontWeight: FontWeight.w600, color: color)),
          ],
        ),
      ),
    );
  }
}

// ── Shimmer placeholder ───────────────────────────────────────────────────────
class _ShimmerCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: Colors.grey[200]!,
      highlightColor: Colors.grey[50]!,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
        ),
      ),
    );
  }
}
