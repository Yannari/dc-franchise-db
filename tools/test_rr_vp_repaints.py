# A result the user saves in edit/<src>/ under the job's own name is the result, for a job that hands nothing out.
# Found 2026-10-20: three new-view jobs (task-dance-academy, task-rug-clearing, task-tennis-court) came back as
# edit/<src>/<file>.png and were skipped as "the frame given out to repaint", which only a repaint job has.
#   python -m pytest tools/test_rr_vp_repaints.py -q
import importlib.util, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location('rp', os.path.join(ROOT, 'tools', 'rr-vp-repaints.py'))
rp = importlib.util.module_from_spec(spec); spec.loader.exec_module(rp)


def test_new_job_result_under_its_own_name_is_a_stray(tmp_path, monkeypatch):
    monkeypatch.setattr(rp, 'FRAMES', str(tmp_path))
    d = tmp_path / 'edit' / '25-pampas-ranch'
    d.mkdir(parents=True)
    (d / 'task-dance-academy.png').write_bytes(b'x')
    (d / 'reference-task-9449004.png').write_bytes(b'x')
    (d / 'prompt.txt').write_text('p')
    jobs = [{'src': '25-pampas-ranch', 'file': 'task-dance-academy', 'new': True, 'ref': 'task-9449004'}]
    assert [os.path.basename(f) for f in rp.strays('25-pampas-ranch', jobs)] == ['task-dance-academy.png']


def test_repaint_job_frame_given_out_is_not_a_stray(tmp_path, monkeypatch):
    monkeypatch.setattr(rp, 'FRAMES', str(tmp_path))
    d = tmp_path / 'edit' / '03-home-city'
    d.mkdir(parents=True)
    (d / 'task-123.png').write_bytes(b'x')
    jobs = [{'src': '03-home-city', 'file': 'task-123', 'sha256': 'abc'}]
    assert rp.strays('03-home-city', jobs) == []
